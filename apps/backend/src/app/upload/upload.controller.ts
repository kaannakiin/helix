import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@org/prisma/client';
import { Roles } from '../../core/decorators/index.js';
import type { UploadResult } from '@org/types/admin/upload';
import { UploadFileDTO } from './dto/index.js';
import { UploadService } from './upload.service.js';

@Controller('admin/upload')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDTO,
  ): Promise<UploadResult> {
    return this.uploadService.uploadFile(file, dto);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Param('imageId') imageId: string): Promise<void> {
    return this.uploadService.deleteImage(imageId);
  }
}
