import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface SecureUploadResult {
  storageKey: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

@Injectable()
export class SecureStorageService {
  private readonly logger = new Logger(SecureStorageService.name);

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to PRIVATE Cloudinary storage.
   * Files uploaded here are NEVER publicly accessible — only via signed URLs.
   * access_mode: 'authenticated' means every request requires a valid signature.
   */
  async uploadPrivate(
    buffer: Buffer,
    opts: {
      folder: string;
      resourceType?: 'image' | 'raw' | 'video';
    },
  ): Promise<SecureUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: opts.folder,
          resource_type: opts.resourceType ?? 'image',
          type: 'private',            // CRITICAL: private type — no public URL ever
          access_mode: 'authenticated', // Requires signed URL
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          phash: true,               // Enable perceptual hash for duplicate detection
        },
        (err, result) => {
          if (err) return reject(new InternalServerErrorException(err.message));
          resolve({
            storageKey: result!.public_id,
            format: result!.format,
            bytes: result!.bytes,
            width: result!.width,
            height: result!.height,
          });
        },
      );

      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });
  }

  /**
   * Generate a time-limited signed URL for BACKEND USE ONLY.
   * Never pass these URLs to the frontend.
   * Default expiry: 30 seconds (just enough for backend to fetch).
   */
  async getSignedUrlForBackend(storageKey: string, expiresInSeconds = 30): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return cloudinary.url(storageKey, {
      type: 'private',
      resource_type: 'image',
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });
  }

  /**
   * Download the raw file buffer — BACKEND ONLY.
   * This is the only way to access the original file.
   */
  async fetchFileBuffer(storageKey: string): Promise<Buffer> {
    const url = await this.getSignedUrlForBackend(storageKey, 15);

    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException(
        `Failed to fetch design from storage: ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Intentionally omitted: deleteFile()
   * Designs cannot be deleted — this is a hard business rule.
   * If this method is ever needed, it must go through admin approval workflow.
   */
}
