import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestMinioModule } from 'nestjs-minio';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageProcessorService } from './image-processor.service';
import { MinioStorageService } from './minio-storage.service';
import { UploadService } from './upload.service';

@Module({
  imports: [
    NestMinioModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        endPoint: config.get<string>('MINIO_ENDPOINT', 'localhost'),
        port: parseInt(config.get<string>('MINIO_PORT', '9000'), 10),
        useSSL: config.get<string>('MINIO_USE_SSL', 'false') === 'true',
        accessKey: config.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
        secretKey: config.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [MinioStorageService, ImageProcessorService, UploadService],
  exports: [UploadService],
})
export class UploadModule {}
