import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileTypeConfigs } from '@org/constants/product-constants';
import { FileType } from '@org/prisma/client';
import type { UploadFileOutput } from '@org/schemas/admin/upload';
import {
  IMAGE_OWNER_FIELD_MAP,
  IMAGE_OWNER_PATH_MAP,
  ImageOwnerType,
  UploadResult,
} from '@org/types/admin/upload';
import { createId } from '@paralleldrive/cuid2';
import { PrismaService } from '../prisma/prisma.service';
import { ImageProcessorService } from './image-processor.service';
import { MinioStorageService } from './minio-storage.service';

function detectFileType(mimeType: string): FileType {
  for (const [type, config] of Object.entries(FileTypeConfigs) as Array<
    [FileType, (typeof FileTypeConfigs)[FileType]]
  >) {
    const patterns = config.mimePatterns;
    const matched = patterns.some((p) => {
      if (p.endsWith('/*')) return mimeType.startsWith(p.slice(0, -1));
      return mimeType === p;
    });
    if (matched) return type;
  }
  return FileType.OTHER;
}

@Injectable()
export class UploadService {
  constructor(
    private readonly minioStorage: MinioStorageService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileOutput
  ): Promise<UploadResult> {
    const mimeType = file.mimetype;
    const fileType = detectFileType(mimeType);
    const ownerPathPrefix = IMAGE_OWNER_PATH_MAP[dto.ownerType];
    const fileId = createId();

    let buffer = file.buffer;
    let contentType = mimeType;
    let ext = file.originalname.split('.').pop() ?? 'bin';
    let width: number | null = null;
    let height: number | null = null;

    if (fileType === FileType.IMAGE) {
      const processed = await this.imageProcessor.processImage(
        buffer,
        dto.isNeedWebp
      );
      buffer = processed.buffer;
      contentType = processed.contentType;
      ext = processed.ext;
      width = processed.width;
      height = processed.height;
    }

    const objectName = `${ownerPathPrefix}/${dto.ownerId}/${fileId}.${ext}`;
    const url = await this.minioStorage.uploadFile({
      objectName,
      buffer,
      contentType,
    });

    if (fileType === FileType.IMAGE && dto.isNeedThumbnail) {
      const thumbnailBuffer = await this.imageProcessor.generateThumbnail(
        file.buffer
      );
      const thumbnailObjectName = `${ownerPathPrefix}/${dto.ownerId}/${fileId}-thumbnail.webp`;
      await this.minioStorage.uploadFile({
        objectName: thumbnailObjectName,
        buffer: thumbnailBuffer,
        contentType: 'image/webp',
      });
    }

    const ownerField = IMAGE_OWNER_FIELD_MAP[dto.ownerType];
    const image = await this.prisma.image.create({
      data: {
        url,
        fileType,
        width,
        height,
        [ownerField]: dto.ownerId,
      },
    });

    return {
      imageId: image.id,
      url: image.url,
      width: image.width,
      height: image.height,
      fileType: image.fileType,
    };
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException(`Image not found`);
    }

    const objectName = this.minioStorage.extractObjectName(image.url);
    await this.minioStorage.deleteFile(objectName);

    // thumbnail varsa sil (konvansiyon: url içinde .webp → -thumbnail.webp)
    if (image.fileType === FileType.IMAGE) {
      const thumbnailObjectName = objectName
        .replace('.webp', '-thumbnail.webp')
        .replace(/\.(jpg|jpeg|png|gif)$/, '-thumbnail.webp');
      try {
        await this.minioStorage.deleteFile(thumbnailObjectName);
      } catch {
        // thumbnail olmayabilir, hata görmezden gel
      }
    }

    await this.prisma.image.delete({ where: { id: imageId } });
  }

  async deleteImagesByOwner(
    ownerType: ImageOwnerType,
    ownerId: string
  ): Promise<void> {
    const images = await this.prisma.image.findMany({
      where: { [IMAGE_OWNER_FIELD_MAP[ownerType]]: ownerId },
      select: { id: true, url: true },
    });

    if (images.length === 0) return;

    const ownerPathPrefix = IMAGE_OWNER_PATH_MAP[ownerType];
    const folderPrefix = `${ownerPathPrefix}/${ownerId}/`;
    await this.minioStorage.deleteFolder(folderPrefix);

    await this.prisma.image.deleteMany({
      where: { [IMAGE_OWNER_FIELD_MAP[ownerType]]: ownerId },
    });
  }
}
