import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { MailModule } from '../mail/mail.module';
import { Invoice, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceItem, InvoiceItemSchema } from './schemas/invoice-item.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { OrderItem, OrderItemSchema } from '../orders/schemas/order-item.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantSchema } from '../products/schemas/product-variant.schema';
import { ProductImage, ProductImageSchema } from '../products/schemas/product-image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: InvoiceItem.name, schema: InvoiceItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductImage.name, schema: ProductImageSchema },
    ]),
    MailModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
