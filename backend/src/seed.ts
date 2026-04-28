/**
 * Mongoose seed script — run with: npx ts-node src/seed.ts
 * Populates users, vendors, categories, products, and variants.
 */
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// ─── Schemas ───────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, enum: ['ADMIN', 'VENDOR', 'CUSTOMER'], default: 'CUSTOMER' },
    avatar: String,
    phone: String,
    googleId: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const VendorSchema = new mongoose.Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', unique: true },
    storeName: String,
    storeSlug: { type: String, unique: true },
    description: String,
    commissionRate: { type: Number, default: 0.1 },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'SUSPENDED'], default: 'PENDING' },
    totalEarnings: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const CategorySchema = new mongoose.Schema(
  {
    name: String,
    slug: { type: String, unique: true },
    image: String,
    parentId: { type: Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true },
);

const ProductSchema = new mongoose.Schema(
  {
    vendorId: { type: Types.ObjectId, ref: 'Vendor' },
    categoryId: { type: Types.ObjectId, ref: 'Category', default: null },
    title: String,
    slug: { type: String, unique: true },
    description: String,
    basePrice: Number,
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT' },
    tags: [String],
  },
  { timestamps: true },
);

const ProductImageSchema = new mongoose.Schema(
  {
    productId: { type: Types.ObjectId, ref: 'Product' },
    url: String,
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: { type: Types.ObjectId, ref: 'Product' },
    size: String,
    color: String,
    stock: { type: Number, default: 0 },
    price: Number,
    sku: String,
  },
  { timestamps: true },
);
ProductVariantSchema.index({ productId: 1, size: 1, color: 1 }, { unique: true });

const UserModel = mongoose.model('User', UserSchema);
const VendorModel = mongoose.model('Vendor', VendorSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const ProductImageModel = mongoose.model('ProductImage', ProductImageSchema);
const ProductVariantModel = mongoose.model('ProductVariant', ProductVariantSchema);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertUser(data: {
  email: string; name: string; passwordHash: string; role: string;
}) {
  return UserModel.findOneAndUpdate(
    { email: data.email },
    { $setOnInsert: data },
    { upsert: true, new: true },
  );
}

async function upsertCategory(slug: string, name: string, image: string) {
  return CategoryModel.findOneAndUpdate(
    { slug },
    { $setOnInsert: { slug, name, image } },
    { upsert: true, new: true },
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/print-city';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('🔌 Connected to MongoDB:', MONGO_URI);

  // ── Users ──────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const vendorHash = await bcrypt.hash('Vendor@123', 12);
  const customerHash = await bcrypt.hash('Customer@123', 12);

  const admin = await upsertUser({ email: 'admin@ap.com', name: 'AP Admin', passwordHash: adminHash, role: 'ADMIN' });
  const vendor1User = await upsertUser({ email: 'vendor1@ap.com', name: 'Alex Design Studio', passwordHash: vendorHash, role: 'VENDOR' });
  const vendor2User = await upsertUser({ email: 'vendor2@ap.com', name: 'PrintPop Creative', passwordHash: vendorHash, role: 'VENDOR' });
  await upsertUser({ email: 'customer@ap.com', name: 'Jane Customer', passwordHash: customerHash, role: 'CUSTOMER' });
  console.log('✅ Users created');

  // ── Vendors ────────────────────────────────────────────────────────────
  const vendor1 = await VendorModel.findOneAndUpdate(
    { userId: vendor1User._id },
    {
      $setOnInsert: {
        userId: vendor1User._id,
        storeName: 'Alex Design Studio',
        storeSlug: 'alex-design-studio',
        description: 'Premium custom apparel designs. Minimalist and modern aesthetic.',
        commissionRate: 0.12,
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true },
  );

  const vendor2 = await VendorModel.findOneAndUpdate(
    { userId: vendor2User._id },
    {
      $setOnInsert: {
        userId: vendor2User._id,
        storeName: 'PrintPop Creative',
        storeSlug: 'printpop-creative',
        description: 'Bold, vibrant designs for every personality.',
        commissionRate: 0.10,
        status: 'ACTIVE',
      },
    },
    { upsert: true, new: true },
  );
  console.log('✅ Vendors created');

  // ── Categories ─────────────────────────────────────────────────────────
  const imgBase = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const cats = await Promise.all([
    upsertCategory('t-shirts', 'T-Shirts', imgBase),
    upsertCategory('hoodies', 'Hoodies', imgBase),
    upsertCategory('mugs', 'Mugs', imgBase),
    upsertCategory('posters', 'Posters', imgBase),
    upsertCategory('phone-cases', 'Phone Cases', imgBase),
  ]);
  console.log('✅ Categories created');

  // ── Products ───────────────────────────────────────────────────────────
  const imageMap: Record<string, string> = {
    'minimalist-mountain-tee': 'photo-1521572163474-6864f9cf17ab',
    'abstract-waves-tee': 'photo-1552062407-291c33eac3af',
    'gradient-sunset-hoodie': 'photo-1556821552-9ae0d9e07871',
    'neon-city-lights-tee': 'photo-1521572163474-6864f9cf17ab',
    'retro-space-mug': 'photo-1514432324607-2e2be62dbd45',
    'botanical-print-hoodie': 'photo-1556821552-9ae0d9e07871',
    'geometric-forest-poster': 'photo-1540570132963-6bdb005c69fe',
    'pixel-art-phone-case': 'photo-1574411662470-fa280b2fc399',
    'typography-quote-tee': 'photo-1521572163474-6864f9cf17ab',
    'minimalist-coffee-mug': 'photo-1514432324607-2e2be62dbd45',
  };

  const productData = [
    { vendor: vendor1, cat: cats[0], title: 'Minimalist Mountain Tee', slug: 'minimalist-mountain-tee', desc: 'Clean mountain silhouette on premium 100% cotton.', basePrice: 799, sizes: ['XS','S','M','L','XL','XXL'], colors: ['White','Black','Navy'] },
    { vendor: vendor1, cat: cats[0], title: 'Abstract Waves Tee', slug: 'abstract-waves-tee', desc: 'Bold abstract wave pattern. 100% organic cotton.', basePrice: 849, sizes: ['S','M','L','XL'], colors: ['White','Light Gray'] },
    { vendor: vendor1, cat: cats[1], title: 'Gradient Sunset Hoodie', slug: 'gradient-sunset-hoodie', desc: 'Warm gradient sunset print on heavyweight fleece hoodie.', basePrice: 1499, sizes: ['S','M','L','XL','XXL'], colors: ['Black','Charcoal'] },
    { vendor: vendor2, cat: cats[0], title: 'Neon City Lights Tee', slug: 'neon-city-lights-tee', desc: 'Vibrant neon cityscape design. Glow in the dark ink.', basePrice: 899, sizes: ['S','M','L','XL'], colors: ['Black','Dark Navy'] },
    { vendor: vendor2, cat: cats[2], title: 'Retro Space Mug', slug: 'retro-space-mug', desc: '11oz ceramic mug with retro space illustration.', basePrice: 599, sizes: ['11oz','15oz'], colors: ['White','Black'] },
    { vendor: vendor2, cat: cats[1], title: 'Botanical Print Hoodie', slug: 'botanical-print-hoodie', desc: 'Delicate botanical illustration on soft pullover hoodie.', basePrice: 1599, sizes: ['XS','S','M','L','XL'], colors: ['Forest Green','Cream'] },
    { vendor: vendor1, cat: cats[3], title: 'Geometric Forest Poster', slug: 'geometric-forest-poster', desc: 'A4/A3 print-ready geometric forest art.', basePrice: 399, sizes: ['A4','A3'], colors: ['Full Color','Black & White'] },
    { vendor: vendor1, cat: cats[4], title: 'Pixel Art Phone Case', slug: 'pixel-art-phone-case', desc: 'Retro pixel art design for major phone models.', basePrice: 499, sizes: ['iPhone 14','iPhone 15','Samsung S23'], colors: ['Transparent','White','Black'] },
    { vendor: vendor2, cat: cats[0], title: 'Typography Quote Tee', slug: 'typography-quote-tee', desc: '"Create boldly" typographic design on premium tee.', basePrice: 749, sizes: ['S','M','L','XL'], colors: ['White','Black'] },
    { vendor: vendor2, cat: cats[2], title: 'Minimalist Coffee Mug', slug: 'minimalist-coffee-mug', desc: 'Clean geometric design. Perfect morning companion.', basePrice: 549, sizes: ['11oz'], colors: ['White','Matte Black'] },
  ];

  for (const p of productData) {
    const existing = await ProductModel.findOne({ slug: p.slug });
    if (existing) continue;

    const imageId = imageMap[p.slug] ?? 'photo-1521572163474-6864f9cf17ab';
    const imageUrl = `https://images.unsplash.com/${imageId}?w=800&q=80`;

    const product = await ProductModel.create({
      vendorId: p.vendor._id,
      categoryId: p.cat._id,
      title: p.title,
      slug: p.slug,
      description: p.desc,
      basePrice: p.basePrice,
      status: 'ACTIVE',
    });

    await ProductImageModel.create({ productId: product._id, url: imageUrl, isPrimary: true });

    for (const size of p.sizes) {
      for (const color of p.colors) {
        const sku = `${String(product._id).slice(-6)}-${size}-${color}`.toUpperCase().replace(/\s/g, '-');
        await ProductVariantModel.findOneAndUpdate(
          { productId: product._id, size, color },
          { $setOnInsert: { productId: product._id, size, color, stock: Math.floor(Math.random() * 50) + 10, price: p.basePrice + (size === 'XXL' ? 50 : 0), sku } },
          { upsert: true },
        );
      }
    }
  }
  console.log('✅ 10 products with variants created');

  console.log('');
  console.log('─────────────────────────────────────');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin:    admin@ap.com    / Admin@123');
  console.log('  Vendor 1: vendor1@ap.com  / Vendor@123');
  console.log('  Vendor 2: vendor2@ap.com  / Vendor@123');
  console.log('  Customer: customer@ap.com / Customer@123');
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
