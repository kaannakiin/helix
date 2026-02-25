import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ImageProcessorService } from './image-processor.service.js';
import { MinioStorageService } from './minio-storage.service.js';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

@Module({
  imports: [
    NestMinioModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        endPoint: config.getOrThrow<string>('MINIO_ENDPOINT'),
        port: parseInt(config.get<string>('MINIO_PORT', '9001'), 10),
        useSSL: config.get<string>('MINIO_USE_SSL', 'false') === 'true',
        accessKey: config.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretKey: config.getOrThrow<string>('MINIO_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [MinioStorageService, ImageProcessorService, UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
