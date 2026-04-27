# API Deployment to Vercel

## Prerequisites
- Vercel account connected to GitHub
- Access to your project's GitHub repo

## Deployment Steps

### 1. Create New Vercel Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Select your GitHub repo `print-city`
4. Choose **Import Git Repository**

### 2. Configure Project Settings
- **Project Name**: `print-city-api` (or your choice)
- **Framework Preset**: Other (Node.js)
- **Root Directory**: `apps/api/`
- **Build Command**: Leave default (uses vercel.json)
- **Start Command**: Leave default (uses vercel.json)

### 3. Environment Variables
Add all these in Vercel Project Settings → Environment Variables:

**Database:**
- `DATABASE_URL`: Your PostgreSQL/Database connection string

**JWT (Auth):**
- `JWT_ACCESS_SECRET`: Your secret key
- `JWT_REFRESH_SECRET`: Your secret key
- `JWT_ACCESS_EXPIRES`: `15m` (or your preference)
- `JWT_REFRESH_EXPIRES`: `7d` (or your preference)

**Cloudinary (Image Upload):**
- `CLOUDINARY_CLOUD_NAME`: Your cloud name
- `CLOUDINARY_API_KEY`: Your API key
- `CLOUDINARY_API_SECRET`: Your API secret

**Stripe (Payments):**
- `STRIPE_SECRET_KEY`: Your secret key
- `STRIPE_WEBHOOK_SECRET`: Your webhook secret
- `STRIPE_PUBLISHABLE_KEY`: Your publishable key

**Email (SMTP):**
- `SMTP_HOST`: Your mail server host
- `SMTP_PORT`: Your mail server port
- `SMTP_USER`: Your email username
- `SMTP_PASS`: Your email password
- `SMTP_FROM`: From email address

**OAuth (Google):**
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
- `GOOGLE_CALLBACK_URL`: `https://your-api-domain/api/auth/google/callback`

**Other:**
- `API_PORT`: Leave empty (Vercel handles this)
- `API_URL`: `https://your-api-domain.vercel.app`
- `FRONTEND_URL`: `https://your-web-domain.vercel.app`
- `NODE_ENV`: `production`

**Payment Gateways (if using):**
- `ESEWA_MERCHANT_CODE`: Your eSewa code
- `ESEWA_SECRET_KEY`: Your eSewa secret
- `KHALTI_SECRET_KEY`: Your Khalti secret
- `KHALTI_PUBLIC_KEY`: Your Khalti public key

### 4. Redis Configuration
If using Bull queues with Redis:
- Add `REDIS_URL` environment variable with your Redis connection string
- Or update the BullModule configuration in your code to handle missing Redis

### 5. Deploy
1. Click **Deploy** on the Vercel dashboard
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, copy your API URL (e.g., `https://print-city-api.vercel.app`)

### 6. Update Web App Configuration
In your web app's Vercel project:
1. Go to **Settings** → **Environment Variables**
2. Add: `NEXT_PUBLIC_API_URL` = `https://print-city-api.vercel.app/api`
3. **Redeploy** the web app

## Troubleshooting

**Build fails with "prisma" errors:**
- Ensure `DATABASE_URL` is set
- Prisma schema is at `apps/api/prisma/schema.prisma`

**Runtime errors with Redis:**
- Either provide `REDIS_URL` or configure Bull to work without Redis
- Update `apps/api/src/queues/queues.module.ts`

**CORS errors from web app:**
- Check that `FRONTEND_URL` is set correctly in API
- Verify CORS is enabled in `apps/api/src/main.ts` (it's configured to use `FRONTEND_URL`)

**Missing dependencies:**
- The `pnpm install` in build command should install all dependencies
- If issues persist, check `apps/api/package.json` and `pnpm-lock.yaml`

## Monitoring

After deployment:
1. Check Vercel Logs: Dashboard → Deployments → Logs
2. Test API: `curl https://your-api-domain.vercel.app/api/health` (if endpoint exists)
3. Monitor errors in Vercel dashboard

## Rollback
If deployment has issues:
1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click **Rollback** to revert to previous version
