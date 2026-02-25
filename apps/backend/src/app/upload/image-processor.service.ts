import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: string;
  ext: string;
}

@Injectable()
export class ImageProcessorService {
  async processImage(
    buffer: Buffer,
    isNeedWebp: boolean,
  ): Promise<ProcessedImage> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (isNeedWebp) {
      const processedBuffer = await image
        .webp({ quality: 85 })
        .toBuffer();

      const processedMeta = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        width: processedMeta.width ?? metadata.width ?? 0,
        height: processedMeta.height ?? metadata.height ?? 0,
        contentType: 'image/webp',
        ext: 'webp',
      };
    }

    const format = metadata.format ?? 'jpeg';
    const contentTypeMap: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return {
      buffer,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      contentType: contentTypeMap[format] ?? 'image/jpeg',
      ext: format === 'jpeg' ? 'jpg' : format,
    };
  }

  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .blur(2)
      .webp({ quality: 20 })
      .toBuffer();
  }
}
