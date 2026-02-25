import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectMinio } from 'nestjs-minio';
import { Client as MinioClient } from 'minio';

@Injectable()
export class MinioStorageService implements OnModuleInit {
  private readonly bucket: string;

  constructor(
    @InjectMinio() private readonly minioClient: MinioClient,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket(this.bucket);
  }

  async ensureBucket(bucketName: string): Promise<void> {
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName);
    }
  }

  async uploadFile(params: {
    objectName: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<string> {
    await this.minioClient.putObject(
      this.bucket,
      params.objectName,
      params.buffer,
      params.buffer.length,
      { 'Content-Type': params.contentType },
    );
    return this.getPublicUrl(params.objectName);
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, objectName);
  }

  async deleteFolder(prefix: string): Promise<void> {
    const objectNames: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = this.minioClient.listObjects(this.bucket, prefix, true);
      stream.on('data', (obj) => {
        if (obj.name) objectNames.push(obj.name);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    if (objectNames.length > 0) {
      await this.minioClient.removeObjects(this.bucket, objectNames);
    }
  }

  getPublicUrl(objectName: string): string {
    const endpoint = this.config.getOrThrow<string>('MINIO_ENDPOINT');
    const port = this.config.get<string>('MINIO_PORT', '9000');
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${objectName}`;
  }

  extractObjectName(url: string): string {
    const bucket = this.bucket;
    const idx = url.indexOf(`/${bucket}/`);
    if (idx === -1) return url;
    return url.slice(idx + bucket.length + 2);
  }
}
