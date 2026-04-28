import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';

import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { CustomDesignModule } from './custom-design/custom-design.module';
import { PayoutsModule } from './payouts/payouts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { VendorsModule } from './vendors/vendors.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { ReviewsModule } from './reviews/reviews.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CouponsModule } from './coupons/coupons.module';
import { ProductionModule } from './production/production.module';
import { SupportModule } from './support/support.module';
import { DesignsModule } from './designs/designs.module';
import { PrintSecureModule } from './print-secure/print-secure.module';
import { AuditLog, AuditLogSchema } from './common/schemas/audit-log.schema';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

// QueuesModule (Bull/Redis) is excluded — Redis is unavailable in serverless.
// Background email jobs fall back to direct MailService calls in the Lambda context.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.DATABASE_URL as string),
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    MailModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    UploadsModule,
    CustomDesignModule,
    PayoutsModule,
    NotificationsModule,
    VendorsModule,
    WishlistModule,
    AddressesModule,
    ReviewsModule,
    InvoicesModule,
    CouponsModule,
    ProductionModule,
    SupportModule,
    DesignsModule,
    PrintSecureModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppLambdaModule {}
