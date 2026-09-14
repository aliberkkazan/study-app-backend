import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import {
  validateImageBuffer,
  generateSecureFileName,
} from './utils/file-security.util';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private supabase: SupabaseClient | null = null;
  private privateBucket: string;

  constructor(private configService: ConfigService) {
    const rawSupabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseUrl = rawSupabaseUrl?.trim().replace(/^["']|["']$/g, '');

    const rawSupabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseKey = rawSupabaseKey?.trim().replace(/^["']|["']$/g, '');

    const rawBucket =
      this.configService.get<string>('SUPABASE_BUCKET') ||
      this.configService.get<string>('SUPABASE_PRIVATE_BUCKET') ||
      'studyapp-assets';
    this.privateBucket = rawBucket.trim().replace(/^["']|["']$/g, '');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log(
        `FilesService initialized for Supabase URL: ${supabaseUrl}, Bucket: ${this.privateBucket}`,
      );
    } else {
      this.logger.warn(
        'Supabase credentials not configured. FilesService running in mock/offline mode.',
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'test-results',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const validated = validateImageBuffer(file.buffer, file.mimetype);
    const fileName = generateSecureFileName(validated.extension);
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-/]/g, '');
    const filePath = `${sanitizedFolder}/${fileName}`;

    if (!this.supabase) {
      // Mock for test/local without Supabase
      return `https://mock-storage.internal/${this.privateBucket}/${filePath}`;
    }

    const { error } = await this.supabase.storage
      .from(this.privateBucket)
      .upload(filePath, validated.buffer, {
        contentType: validated.mimeType,
        upsert: false,
      });

    if (error) {
      const cause =
        (error as any)?.originalError?.cause?.message ||
        (error as any)?.cause?.message ||
        (error as any)?.message;
      this.logger.error(
        `Upload error: ${error.message} (Bucket: ${this.privateBucket}, Detail: ${cause})`,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    if (this.configService.get<string>('USE_SIGNED_URLS') === 'true') {
      return this.createSignedUrl(filePath, 3600);
    }

    const { data: publicData } = this.supabase.storage
      .from(this.privateBucket)
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  async uploadBase64File(
    base64String: string,
    folderPath = 'submissions',
  ): Promise<string> {
    if (!base64String || typeof base64String !== 'string') {
      throw new BadRequestException('Invalid base64 payload');
    }

    // Limit base64 length to ~7MB (~5MB decoded)
    if (base64String.length > 7.5 * 1024 * 1024) {
      throw new BadRequestException(
        'Base64 image size exceeds maximum 5MB limit',
      );
    }

    const cleanBase64 = base64String.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      '',
    );
    let buffer: Buffer;
    try {
      buffer = Buffer.from(cleanBase64, 'base64');
    } catch {
      throw new BadRequestException('Failed to decode base64 image data');
    }

    const validated = validateImageBuffer(buffer);
    const fileName = generateSecureFileName(validated.extension);
    const sanitizedFolder = folderPath.replace(/[^a-zA-Z0-9_\-/]/g, '');
    const filePath = `${sanitizedFolder}/${fileName}`;

    if (!this.supabase) {
      return `https://mock-storage.internal/${this.privateBucket}/${filePath}`;
    }

    const { error } = await this.supabase.storage
      .from(this.privateBucket)
      .upload(filePath, validated.buffer, {
        contentType: validated.mimeType,
        upsert: false,
      });

    if (error) {
      const cause =
        (error as any)?.originalError?.cause?.message ||
        (error as any)?.cause?.message ||
        (error as any)?.message;
      this.logger.error(
        `Base64 upload error: ${error.message} (Bucket: ${this.privateBucket}, Detail: ${cause})`,
      );
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    if (this.configService.get<string>('USE_SIGNED_URLS') === 'true') {
      return this.createSignedUrl(filePath, 3600);
    }

    const { data: publicData } = this.supabase.storage
      .from(this.privateBucket)
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  async createSignedUrl(
    filePath: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    if (!this.supabase) {
      return `https://mock-storage.internal/${this.privateBucket}/${filePath}?token=mock-signed`;
    }

    // Clean leading slash or bucket name if passed
    const cleanPath = filePath
      .replace(/^\/+/, '')
      .replace(new RegExp(`^${this.privateBucket}/`), '');

    const { data, error } = await this.supabase.storage
      .from(this.privateBucket)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      this.logger.error(`Failed to generate signed URL: ${error?.message}`);
      throw new BadRequestException(
        'Could not generate secure file access URL',
      );
    }

    return data.signedUrl;
  }
}
