import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface ValidatedFile {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  width?: number;
  height?: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 4096; // 4096px max width/height

/**
 * Validates file buffer magic bytes, MIME type allowlist, size limits, and image dimensions
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredMimeType?: string,
): ValidatedFile {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('File is empty');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    );
  }

  // Detect signature from magic bytes
  let detectedMime: 'image/jpeg' | 'image/png' | 'image/webp' | null = null;
  let extension: 'jpg' | 'png' | 'webp' = 'jpg';

  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    detectedMime = 'image/jpeg';
    extension = 'jpg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  else if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = 'image/png';
    extension = 'png';
  }
  // WebP: RIFF .... WEBP
  else if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    detectedMime = 'image/webp';
    extension = 'webp';
  }

  if (!detectedMime) {
    throw new BadRequestException(
      'Invalid file format. Only JPEG, PNG, and WebP images with valid signatures are accepted.',
    );
  }

  if (declaredMimeType && !ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    throw new BadRequestException(
      `MIME type '${declaredMimeType}' is not allowed`,
    );
  }

  // Validate image dimensions
  const dimensions = parseImageDimensions(buffer, detectedMime);
  if (dimensions) {
    if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
      throw new BadRequestException(
        `Image dimensions ${dimensions.width}x${dimensions.height} exceed maximum allowed resolution of ${MAX_DIMENSION}x${MAX_DIMENSION}px`,
      );
    }
  }

  return {
    buffer,
    mimeType: detectedMime,
    extension,
    width: dimensions?.width,
    height: dimensions?.height,
  };
}

/**
 * Parses image header for width & height without external binary dependencies
 */
function parseImageDimensions(
  buffer: Buffer,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
): { width: number; height: number } | null {
  try {
    if (mime === 'image/png' && buffer.length >= 24) {
      // PNG IHDR starts at offset 16 (4 bytes width, 4 bytes height, big-endian)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (mime === 'image/jpeg') {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        // SOF0 (0xC0) to SOF2 (0xC2) markers contain dimensions
        if (marker >= 0xc0 && marker <= 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mime === 'image/webp' && buffer.length >= 30) {
      // VP8 chunk
      if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3fff;
        const height = buffer.readUInt16LE(28) & 0x3fff;
        return { width, height };
      }
      // VP8L chunk (lossless)
      if (buffer.toString('ascii', 12, 16) === 'VP8L') {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height =
          1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        return { width, height };
      }
      // VP8X chunk (extended)
      if (buffer.toString('ascii', 12, 16) === 'VP8X') {
        const width = 1 + buffer.readUIntLE(24, 3);
        const height = 1 + buffer.readUIntLE(27, 3);
        return { width, height };
      }
    }
  } catch {
    // If dimension parsing fails, allow file if magic bytes passed
  }
  return null;
}

/**
 * Generates an unguessable safe file name using UUID and extension
 */
export function generateSecureFileName(extension: string): string {
  return `${crypto.randomUUID()}.${extension}`;
}
