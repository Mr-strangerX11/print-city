# AP — Custom Print Marketplace

Premium multi-vendor custom print marketplace. Vendors upload designs, customers buy or upload their own artwork, admin handles fulfillment.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 · TypeScript · TailwindCSS · shadcn/ui |
| Backend | NestJS · TypeScript · REST API |
| Database | PostgreSQL · Prisma ORM |
| Auth | JWT (access + refresh) · Role-based (Admin/Vendor/Customer) |
| Storage | Cloudinary |
| Payments | Stripe + eSewa/Khalti placeholders |
| Email | Nodemailer (SMTP) |
| Infra | Docker · docker-compose |
| Monorepo | pnpm workspaces · Turborepo |

---

## Quick Start

### Option A — Docker (recommended)

```bash
# 1. Clone and copy env
cp .env.example .env
# Edit .env with your API keys

# 2. Start all services
docker-compose up -d

# 3. Run migrations + seed
docker exec ap_api npx prisma migrate deploy
docker exec ap_api npx ts-node prisma/seed.ts
```

App will be at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Swagger**: http://localhost:4000/docs

---

### Option B — Local Dev

#### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 9 (`npm i -g pnpm`)
- PostgreSQL running locally
- Redis running locally

#### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Setup env files
cp .env.example .env
# Edit apps/api/.env with your DB, Redis, Cloudinary, Stripe keys

# 3. Generate Prisma client + run migrations
pnpm db:generate
pnpm db:migrate

# 4. Seed database
pnpm db:seed

# 5. Start dev servers (both API + Web in parallel)
pnpm dev
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ap.com | Admin@123 |
| Vendor 1 | vendor1@ap.com | Vendor@123 |
| Vendor 2 | vendor2@ap.com | Vendor@123 |
| Customer | customer@ap.com | Customer@123 |

---

## Project Structure

```
ap/
├── apps/
│   ├── api/                    # NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Full DB schema
│   │   │   └── seed.ts         # Seed data
│   │   └── src/
│   │       ├── auth/           # JWT auth + strategies
│   │       ├── cart/           # Cart management
│   │       ├── categories/     # Product categories
│   │       ├── custom-design/  # Custom print orders
│   │       ├── mail/           # Nodemailer
│   │       ├── notifications/  # In-app notifications
│   │       ├── orders/         # Order lifecycle
│   │       ├── payouts/        # Vendor commissions
│   │       ├── payments/       # Stripe + webhooks
│   │       ├── prisma/         # Prisma service
│   │       ├── products/       # Products + CSV import
│   │       ├── uploads/        # Cloudinary uploads
│   │       └── vendors/        # Vendor management
│   └── web/                    # Next.js 15
│       └── src/app/
│           ├── page.tsx                    # Home
│           ├── products/                   # Product listing + detail
│           ├── vendors/                    # Vendor store pages
│           ├── cart/                       # Shopping cart
│           ├── checkout/                   # Checkout + success
│           ├── (auth)/                     # Login + Register
│           ├── dashboard/                  # Customer dashboard
│           │   ├── orders/                 # Order history + tracking
│           │   └── design-upload/          # Custom design studio (Konva)
│           ├── vendor/                     # Vendor dashboard
│           │   ├── designs/                # Manage designs
│           │   ├── earnings/               # Earnings & payouts
│           │   └── settings/               # Store settings
│           └── admin/                      # Admin dashboard
│               ├── orders/                 # Order management
│               ├── vendors/                # Vendor approval + commission
│               ├── products/               # Product approval
│               ├── custom-orders/          # Custom design review
│               ├── payouts/                # Run payout cycles
│               └── import/                 # CSV bulk import
└── packages/
    └── config/                 # Shared TypeScript configs
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user/vendor |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/products | Public | List products |
| GET | /api/products/:slug | Public | Product detail |
| POST | /api/products | VENDOR | Create product |
| POST | /api/products/import-csv | ADMIN | CSV bulk import |
| GET | /api/categories | Public | All categories |
| GET | /api/cart | JWT | Get cart |
| POST | /api/cart/items | JWT | Add to cart |
| POST | /api/orders | JWT | Checkout |
| PATCH | /api/orders/:id/status | ADMIN | Update order status |
| POST | /api/payments/checkout/:orderId | JWT | Stripe checkout |
| POST | /api/payments/webhook | Public | Stripe webhook |
| POST | /api/custom-design | JWT | Submit custom order |
| GET | /api/payouts/earnings | VENDOR | Vendor earnings |
| POST | /api/payouts/run | ADMIN | Run payout cycle |
| GET | /api/uploads/sign | JWT | Cloudinary signature |

Full Swagger docs: http://localhost:4000/docs

---

## Business Logic

### Commission Flow
```
Sale Price × commissionRate = vendorCommission
Sale Price - vendorCommission = adminAmount
```

Commission accrues **only** when:
- `orderStatus = DELIVERED` AND
- `paymentStatus = PAID`

Refunds reverse all commissions.

### Payout Cycle
1. Admin triggers `POST /api/payouts/run` with a date range
2. System groups all qualifying order items by vendor
3. Creates `Payout` records with `status = PAYABLE`
4. Admin manually marks each as `PAID` after bank transfer

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
CLOUDINARY_CLOUD_NAME=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Docker Services

| Service | Port | Description |
|---|---|---|
| postgres | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |
| api | 4000 | NestJS API |
| web | 3000 | Next.js frontend |

---

## CSV Import Format

```csv
title,description,basePrice,category,imageUrl,tags
My Tee,A great tee,799,T-Shirts,https://img.url,minimal|tee
```

Required: `title`, `basePrice`  
Optional: `description`, `category` (must match existing), `imageUrl`, `tags` (pipe-separated)

Download template from `/admin/import`.
