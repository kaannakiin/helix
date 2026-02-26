import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { TagGroupsModule } from './tag-groups/tag-groups.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { VariantGroupsModule } from './variant-groups/variant-groups.module';

@Module({
  imports: [
    PrismaModule,
    CustomersModule,
    ProductsModule,
    BrandsModule,
    CategoriesModule,
    TagGroupsModule,
    TaxonomyModule,
    VariantGroupsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
