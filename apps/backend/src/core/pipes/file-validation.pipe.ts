import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { FileTypeConfigs } from '@org/constants/product-constants';
import { type FileType } from '@org/prisma/client';

export interface FileValidationOptions {
  allowedTypes: FileType[];
  maxSize?: number; // bytes, default 5MB
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

function matchesMimePattern(mime: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    if (p.endsWith('/*')) return mime.startsWith(p.slice(0, -1));
    return mime === p;
  });
}

function getAllowedMimePatterns(allowedTypes: FileType[]): string[] {
  return allowedTypes.flatMap((ft) => FileTypeConfigs[ft].mimePatterns);
}

function getAllowedExtensions(allowedTypes: FileType[]): string[] {
  return allowedTypes.flatMap((ft) => FileTypeConfigs[ft].extensions);
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedTypes: FileType[];
  private readonly maxSize: number;
  private readonly mimePatterns: string[];

  constructor(options: FileValidationOptions) {
    this.allowedTypes = options.allowedTypes;
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.mimePatterns = getAllowedMimePatterns(this.allowedTypes);
  }

  transform(
    value: Express.Multer.File | Express.Multer.File[] | undefined
  ): Express.Multer.File | Express.Multer.File[] | undefined {
    if (!value) return value;

    const files = Array.isArray(value) ? value : [value];

    for (const file of files) {
      if (file.size > this.maxSize) {
        const maxMB = (this.maxSize / (1024 * 1024)).toFixed(0);
        throw new BadRequestException(
          `backend.errors.file_too_large|{"max":"${maxMB}MB"}`
        );
      }

      if (!matchesMimePattern(file.mimetype, this.mimePatterns)) {
        const allowed = getAllowedExtensions(this.allowedTypes).join(', ');
        throw new BadRequestException(
          `backend.errors.file_type_not_allowed|{"allowed":"${allowed}"}`
        );
      }
    }

    return value;
  }
}
