import { PrismaClient, Role, VendorStatus, ProductStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ap.com' },
    update: {},
    create: {
      name: 'AP Admin',
      email: 'admin@ap.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ─── Categories ───────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 't-shirts' },
      update: {},
      create: { name: 'T-Shirts', slug: 't-shirts', image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
    }),
    prisma.category.upsert({
      where: { slug: 'hoodies' },
      update: {},
      create: { name: 'Hoodies', slug: 'hoodies', image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
    }),
    prisma.category.upsert({
      where: { slug: 'mugs' },
      update: {},
      create: { name: 'Mugs', slug: 'mugs', image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
    }),
    prisma.category.upsert({
      where: { slug: 'posters' },
      update: {},
      create: { name: 'Posters', slug: 'posters', image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
    }),
    prisma.category.upsert({
      where: { slug: 'phone-cases' },
      update: {},
      create: { name: 'Phone Cases', slug: 'phone-cases', image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
    }),
  ]);
  console.log('✅ Categories created');

  // ─── Vendors ──────────────────────────────────────────────
  const vendorPassword = await bcrypt.hash('Vendor@123', 12);

  const vendor1User = await prisma.user.upsert({
    where: { email: 'vendor1@ap.com' },
    update: {},
    create: {
      name: 'Alex Design Studio',
      email: 'vendor1@ap.com',
      passwordHash: vendorPassword,
      role: Role.VENDOR,
    },
  });

  const vendor1 = await prisma.vendor.upsert({
    where: { userId: vendor1User.id },
    update: {},
    create: {
      userId: vendor1User.id,
      storeName: 'Alex Design Studio',
      storeSlug: 'alex-design-studio',
      description: 'Premium custom apparel designs. Minimalist and modern aesthetic.',
      commissionRate: 0.12,
      status: VendorStatus.ACTIVE,
    },
  });

  const vendor2User = await prisma.user.upsert({
    where: { email: 'vendor2@ap.com' },
    update: {},
    create: {
      name: 'PrintPop Creative',
      email: 'vendor2@ap.com',
      passwordHash: vendorPassword,
      role: Role.VENDOR,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      userId: vendor2User.id,
      storeName: 'PrintPop Creative',
      storeSlug: 'printpop-creative',
      description: 'Bold, vibrant designs for every personality.',
      commissionRate: 0.10,
      status: VendorStatus.ACTIVE,
    },
  });
  console.log('✅ Vendors created');

  // ─── Customer ─────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@ap.com' },
    update: {},
    create: {
      name: 'Jane Customer',
      email: 'customer@ap.com',
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
    },
  });
  console.log('✅ Customer created');

  // ─── Products ─────────────────────────────────────────────
  const productData = [
    {
      vendorId: vendor1.id,
      categoryId: categories[0].id,
      title: 'Minimalist Mountain Tee',
      slug: 'minimalist-mountain-tee',
      description: 'Clean mountain silhouette on premium 100% cotton. Perfect for outdoor enthusiasts.',
      basePrice: 799,
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Black', 'Navy'],
    },
    {
      vendorId: vendor1.id,
      categoryId: categories[0].id,
      title: 'Abstract Waves Tee',
      slug: 'abstract-waves-tee',
      description: 'Bold abstract wave pattern. 100% organic cotton.',
      basePrice: 849,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Light Gray'],
    },
    {
      vendorId: vendor1.id,
      categoryId: categories[1].id,
      title: 'Gradient Sunset Hoodie',
      slug: 'gradient-sunset-hoodie',
      description: 'Warm gradient sunset print on heavyweight fleece hoodie.',
      basePrice: 1499,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Charcoal'],
    },
    {
      vendorId: vendor2.id,
      categoryId: categories[0].id,
      title: 'Neon City Lights Tee',
      slug: 'neon-city-lights-tee',
      description: 'Vibrant neon cityscape design. Glow in the dark ink.',
      basePrice: 899,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Dark Navy'],
    },
    {
      vendorId: vendor2.id,
      categoryId: categories[2].id,
      title: 'Retro Space Mug',
      slug: 'retro-space-mug',
      description: '11oz ceramic mug with retro space illustration. Dishwasher safe.',
      basePrice: 599,
      sizes: ['11oz', '15oz'],
      colors: ['White', 'Black'],
    },
    {
      vendorId: vendor2.id,
      categoryId: categories[1].id,
      title: 'Botanical Print Hoodie',
      slug: 'botanical-print-hoodie',
      description: 'Delicate botanical illustration on soft pullover hoodie.',
      basePrice: 1599,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Forest Green', 'Cream'],
    },
    {
      vendorId: vendor1.id,
      categoryId: categories[3].id,
      title: 'Geometric Forest Poster',
      slug: 'geometric-forest-poster',
      description: 'A4/A3 print-ready geometric forest art. Museum-quality paper.',
      basePrice: 399,
      sizes: ['A4', 'A3'],
      colors: ['Full Color', 'Black & White'],
    },
    {
      vendorId: vendor1.id,
      categoryId: categories[4].id,
      title: 'Pixel Art Phone Case',
      slug: 'pixel-art-phone-case',
      description: 'Retro pixel art design. Available for major phone models.',
      basePrice: 499,
      sizes: ['iPhone 14', 'iPhone 15', 'Samsung S23'],
      colors: ['Transparent', 'White', 'Black'],
    },
    {
      vendorId: vendor2.id,
      categoryId: categories[0].id,
      title: 'Typography Quote Tee',
      slug: 'typography-quote-tee',
      description: '"Create boldly" typographic design on premium tee.',
      basePrice: 749,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black'],
    },
    {
      vendorId: vendor2.id,
      categoryId: categories[2].id,
      title: 'Minimalist Coffee Mug',
      slug: 'minimalist-coffee-mug',
      description: 'Clean geometric design. Perfect morning companion.',
      basePrice: 549,
      sizes: ['11oz'],
      colors: ['White', 'Matte Black'],
    },
  ];

  // Map of product slugs to stable Unsplash image IDs
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

  for (const p of productData) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    // Use stable Unsplash image URL with fallback
    const imageId = imageMap[p.slug] || 'photo-1521572163474-6864f9cf17ab';
    const imageUrl = `https://images.unsplash.com/${imageId}?w=800&q=80`;

    const product = await prisma.product.create({
      data: {
        vendorId: p.vendorId,
        categoryId: p.categoryId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        status: ProductStatus.ACTIVE,
        images: {
          create: [
            {
              url: imageUrl,
              isPrimary: true,
            },
          ],
        },
      },
    });

    for (const size of p.sizes) {
      for (const color of p.colors) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size,
            color,
            stock: Math.floor(Math.random() * 50) + 10,
            price: p.basePrice + (size === 'XXL' ? 50 : 0),
            sku: `${product.id.slice(-6)}-${size}-${color}`.toUpperCase().replace(/\s/g, '-'),
          },
        });
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
