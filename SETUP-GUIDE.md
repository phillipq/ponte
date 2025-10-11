# 🚀 App Template Setup Guide

This guide will help you set up a new instance of your AI app template with Supabase and Stripe.

## 📋 Prerequisites

- Node.js 20+
- Supabase account
- Stripe account
- Git

## 🗄️ **Step 1: Database Setup (Supabase)**

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `your-app-name-db`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**

### Get Database Connection String
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. It looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## 💳 **Step 2: Stripe Setup**

### Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account verification
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key** (use test keys for development)

### Create Products and Prices
1. Go to **Products** in Stripe dashboard
2. Create products for your subscription tiers:
   - **Free Plan** (optional, handled in code)
   - **Pro Plan** - $29/month
   - **Enterprise Plan** - $99/month
3. For each paid plan, create a **Price** with:
   - **Billing period**: Monthly
   - **Price**: $29.00 or $99.00
4. Copy the **Price IDs** (they start with `price_`)

### Setup Webhooks
1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## 🔧 **Step 3: Template Setup**

### Clone and Install
```bash
# Clone your template repository
git clone <your-template-repo-url>
cd your-app-name

# Install dependencies
pnpm install
```

### Environment Configuration
```bash
# Copy environment template
cp env.template .env.local

# Edit with your actual values
nano .env.local
```

### Required Environment Variables
```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Bundle Analyzer
ANALYZE="false"
```

## 🗃️ **Step 4: Database Migration**

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

## 🎨 **Step 5: Customize Your App**

### Update Pricing Page
Edit `app/pricing/page.tsx` and replace the placeholder price IDs:

```typescript
// Replace these with your actual Stripe price IDs
stripePriceId: "price_1234567890", // Your Pro plan price ID
stripePriceId: "price_0987654321", // Your Enterprise plan price ID
```

### Update App Branding
1. **App Name**: Update in `components/Navigation.tsx`
2. **Colors**: Modify Tailwind classes in components
3. **Logo**: Replace in `app/layout.tsx` or components
4. **Domain**: Update `NEXTAUTH_URL` for production

## 🚀 **Step 6: Test Locally**

```bash
# Start development server
pnpm dev

# Test the following:
# 1. User registration: http://localhost:3000/auth/signup
# 2. User login: http://localhost:3000/auth/signin
# 3. Dashboard: http://localhost:3000/dashboard
# 4. Pricing: http://localhost:3000/pricing
# 5. Billing: http://localhost:3000/billing
```

## 🌐 **Step 7: Deploy to Production**

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Update `NEXTAUTH_URL` to your production domain
4. Deploy

### Update Stripe Webhook
1. Go to Stripe webhook settings
2. Update endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
3. Test webhook delivery

## ✅ **Verification Checklist**

- [ ] Supabase project created and connected
- [ ] Stripe products and prices created
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads correctly
- [ ] Pricing page shows correct plans
- [ ] Stripe checkout works (test mode)
- [ ] Webhook receives events
- [ ] Production deployment successful

## 🆘 **Troubleshooting**

### Database Connection Issues
- Verify Supabase project is active
- Check connection string format
- Ensure database password is correct

### Stripe Issues
- Use test keys for development
- Verify webhook endpoint is accessible
- Check Stripe dashboard for failed events

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure Google OAuth is configured (if using)

## 📞 **Support**

If you encounter issues:
1. Check the logs in your terminal
2. Verify all environment variables are set
3. Test each component individually
4. Check Supabase and Stripe dashboards for errors

---

**Your AI app template is now ready for production!** 🎉

