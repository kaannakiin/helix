import { Controller } from '@nestjs/common';
import { UserRole } from '@org/prisma/client';
import { Roles } from '../../core/decorators';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
