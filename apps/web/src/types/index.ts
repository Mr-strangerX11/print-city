export type Role = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type InvoiceStatus = 'ISSUED' | 'PAID' | 'CANCELLED' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PRINTING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'PAYABLE' | 'PAID';
export type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type ProductStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';
export type CustomOrderStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'PRINTING' | 'SHIPPED' | 'DELIVERED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  vendor?: Vendor;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  commissionRate: number;
  status: VendorStatus;
  totalEarnings: number;
  _count?: { products: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  sku?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  altText?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  basePrice: number;
  status: ProductStatus;
  tags: string[];
  createdAt: string;
  vendor?: Pick<Vendor, 'storeName' | 'storeSlug' | 'logo' | 'description'>;
  category?: Pick<Category, 'name' | 'slug'>;
  variants?: ProductVariant[];
  images?: ProductImage[];
  reviews?: Review[];
  _count?: { reviews: number };
}

export interface CartItem {
  id: string;
  cartId: string;
  productVariantId: string;
  qty: number;
  variant: ProductVariant & { product: Product };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export interface OrderItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  qty: number;
  price: number;
  vendorCommission: number;
  adminAmount: number;
  vendor?: Pick<Vendor, 'storeName'>;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  trackingNumber?: string;
  createdAt: string;
  items: OrderItem[];
  user?: Pick<User, 'name' | 'email'>;
  payment?: Payment;
}

export interface Payment {
  id: string;
  provider: string;
  amount: number;
  status: PaymentStatus;
  externalId?: string;
}

export interface CustomDesignOrder {
  id: string;
  productType: string;
  designUrl: string;
  notes?: string;
  status: CustomOrderStatus;
  price?: number;
  size?: string;
  color?: string;
  qty: number;
  createdAt: string;
  user?: Pick<User, 'name' | 'email'>;
}

export interface Payout {
  id: string;
  vendorId: string;
  amount: number;
  status: PayoutStatus;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  vendor?: Pick<Vendor, 'storeName'>;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: Pick<User, 'name' | 'avatar'>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  readAt?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  variantId: string;
  vendorId: string;
  productName: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  total: number;
  vendorEarning: number;
  adminEarning: number;
  productImageUrl?: string;
  vendor?: Pick<Vendor, 'storeName' | 'logo'>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  totalVendorEarnings: number;
  totalAdminEarnings: number;
  notes?: string;
  issuedAt: string;
  createdAt: string;
  user?: Pick<User, 'name' | 'email' | 'phone'>;
  order?: Order;
  items: InvoiceItem[];
  _count?: { items: number };
}

export interface InvoiceStats {
  total: number;
  issued: number;
  paid: number;
  monthlyCount: number;
  totalRevenue: number;
  totalAdminEarnings: number;
  totalVendorEarnings: number;
  monthlyRevenue: number;
  monthlyAdminEarnings: number;
}

export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
export type PrintJobStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type QCStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'REWORK';
export type ShipmentStatus = 'PENDING' | 'LABEL_CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'FAILED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface PrintJob {
  id: string;
  orderId: string;
  status: PrintJobStatus;
  createdAt: string;
  order?: Pick<Order, 'id' | 'user' | 'items'>;
}

export interface QualityCheck {
  id: string;
  printJobId: string;
  status: QCStatus;
  notes?: string;
  createdAt: string;
  printJob?: PrintJob;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  provider?: string;
  trackingNumber?: string;
  labelUrl?: string;
  estimatedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  order?: Pick<Order, 'id' | 'user'>;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  user?: Pick<User, 'name' | 'avatar'>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'name' | 'email' | 'avatar'>;
  messages?: SupportMessage[];
  _count?: { messages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
