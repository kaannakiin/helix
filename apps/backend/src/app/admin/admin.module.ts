import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { StoresModule } from './stores/stores.module.js';
import { TagGroupsModule } from './tag-groups/tag-groups.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { PriceListsModule } from './price-lists/price-lists.module';
import { VariantGroupsModule } from './variant-groups/variant-groups.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';
import { EvaluationModule } from './evaluation/evaluation.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EvaluationModule,
    CustomersModule,
    ProductsModule,
    BrandsModule,
    CategoriesModule,
    TagGroupsModule,
    TaxonomyModule,
    VariantGroupsModule,
    PriceListsModule,
    CustomerGroupsModule,
    StoresModule,
    WarehousesModule,
    OrganizationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
