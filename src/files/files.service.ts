import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || this.configService.get<string>('SUPABASE_ANON_KEY')!;
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ... (keep uploadFile as is or update similarly if needed, assuming user uses uploadBase64File)

  async uploadFile(file: Express.Multer.File): Promise<string> {
      // skipping for brevity as we focus on base64
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `test-results/${fileName}`;
  
      const { data, error } = await this.supabase.storage
        .from('uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
  
      if (error) throw new BadRequestException(`Upload failed: ${error.message}`);
  
      const { data: publicData } = this.supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
  
      return publicData.publicUrl;
  }

  async uploadBase64File(base64String: string, folderPath?: string): Promise<string> {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Simple extension detection or default to jpg
    let extension = 'jpg';
    if (base64String.startsWith('data:image/png')) {
      extension = 'png';
    } else if (base64String.startsWith('data:image/jpeg')) {
      extension = 'jpeg';
    } else if (base64String.startsWith('data:image/webp')) {
      extension = 'webp';
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : `submissions/${fileName}`;

    const { error } = await this.supabase.storage
      .from('studyapp-assets')
      .upload(filePath, buffer, {
        contentType: `image/${extension}`,
        upsert: false,
      });

    if (error) {
        throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage
      .from('studyapp-assets')
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }
}