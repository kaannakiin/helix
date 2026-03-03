import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@org/prisma/client';
import type { UploadResult } from '@org/types/admin/upload';
import { Roles } from '../../core/decorators/index';
import { UploadFileDTO } from './dto/index';
import { UploadService } from './upload.service';

@Controller('admin/upload')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDTO
  ): Promise<UploadResult> {
    return this.uploadService.uploadFile(file, dto);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Param('imageId') imageId: string): Promise<void> {
    return this.uploadService.deleteImage(imageId);
  }
}
