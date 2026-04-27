# Environment Variables Checklist for Vercel Deployment

## Required Variables - Fill these in with your actual values

### Database (REQUIRED)
- [ ] DATABASE_URL: `postgresql://user:password@host:port/database`

### JWT Authentication (REQUIRED)
- [ ] JWT_ACCESS_SECRET: (any random string, e.g., `your-secret-key-min-32-chars`)
- [ ] JWT_REFRESH_SECRET: (different random string)
- [ ] JWT_ACCESS_EXPIRES: `15m`
- [ ] JWT_REFRESH_EXPIRES: `7d`

### Cloudinary - Image Upload (REQUIRED)
- [ ] CLOUDINARY_CLOUD_NAME: (from Cloudinary dashboard)
- [ ] CLOUDINARY_API_KEY: (from Cloudinary dashboard)
- [ ] CLOUDINARY_API_SECRET: (from Cloudinary dashboard)

### Stripe - Payments (REQUIRED)
- [ ] STRIPE_SECRET_KEY: (from Stripe dashboard - secret key)
- [ ] STRIPE_WEBHOOK_SECRET: (from Stripe dashboard - webhook signing secret)
- [ ] STRIPE_PUBLISHABLE_KEY: (from Stripe dashboard - publishable key)

### Email - SMTP (REQUIRED)
- [ ] SMTP_HOST: (your email provider's SMTP host, e.g., smtp.gmail.com)
- [ ] SMTP_PORT: (usually 587 or 465)
- [ ] SMTP_USER: (your email address)
- [ ] SMTP_PASS: (your email password or app-specific password)
- [ ] SMTP_FROM: (sender email, usually same as SMTP_USER)

### Google OAuth (OPTIONAL but recommended for social login)
- [ ] GOOGLE_CLIENT_ID: (from Google Cloud Console)
- [ ] GOOGLE_CLIENT_SECRET: (from Google Cloud Console)
- [ ] GOOGLE_CALLBACK_URL: `https://your-api-domain.vercel.app/api/auth/google/callback` (update with your domain)

### URLs (REQUIRED)
- [ ] API_URL: `https://your-api-domain.vercel.app` (update after deployment)
- [ ] FRONTEND_URL: `https://your-web-domain.vercel.app` (your web app URL)
- [ ] NODE_ENV: `production`

### Payment Gateways (OPTIONAL - only if using eSewa/Khalti)
- [ ] ESEWA_MERCHANT_CODE: (from eSewa)
- [ ] ESEWA_SECRET_KEY: (from eSewa)
- [ ] KHALTI_SECRET_KEY: (from Khalti)
- [ ] KHALTI_PUBLIC_KEY: (from Khalti)

### Redis (OPTIONAL - only if using Bull queues)
- [ ] REDIS_URL: `redis://user:password@host:port` (leave empty if not using Redis)

---

## How to Add to Vercel

1. Go to https://vercel.com/dashboard
2. Select your `print-city-api` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the checklist above
5. **Important**: Select environment where each applies (Production/Preview/Development)
6. Click **Save**
7. **Redeploy** the project to apply changes

## How to Generate Secrets

### JWT Secrets (Linux/Mac)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run this twice to get two different secrets.

### Generating from OpenSSL
```bash
openssl rand -hex 32
```

---

## Deployment Order

1. **Create API project on Vercel** (with root directory: `apps/api/`)
2. **Add Database URL** (must be set for build to succeed)
3. **Add all required environment variables** (from checklist above)
4. **Deploy** - let it build
5. **Copy deployed API URL** (e.g., `https://print-city-api.vercel.app`)
6. **Update web app** - add `NEXT_PUBLIC_API_URL=https://print-city-api.vercel.app/api`
7. **Redeploy web app**

---

## Testing After Deployment

Once deployed, test with:
```bash
curl https://your-api-domain.vercel.app/api/docs
```
This should show your Swagger API documentation.
