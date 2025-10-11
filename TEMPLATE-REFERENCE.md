# AI App Template - Complete Reference Guide

## 🎯 Overview

This is a production-ready Next.js 15 template for standalone AI applications with centralized user management, subscription billing, and multi-app admin capabilities. Each app can be deployed as a subdomain (e.g., `app1.mywebsite.com`) while sharing a centralized admin dashboard.

## 🏗️ Architecture

### Multi-App System
- **Single Database**: All apps share one Supabase PostgreSQL database
- **App Isolation**: Each app has a unique `appId` for data separation
- **Centralized Admin**: Master admin dashboard manages all apps
- **Individual Admins**: Each app can have its own admin interface

### Tech Stack
- **Frontend**: Next.js 15 (App Directory), Tailwind CSS v4
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Payments**: Stripe (subscriptions, webhooks, customer portal)
- **Authentication**: NextAuth.js (Credentials + Google OAuth)
- **Deployment**: Vercel-ready with environment validation

## 📁 Project Structure

```
app-template/
├── app/                          # Next.js App Directory
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin management endpoints
│   │   └── stripe/               # Payment processing
│   ├── auth/                     # Auth pages (signin, signup)
│   ├── admin/                    # Admin dashboard
│   ├── dashboard/                # User dashboard
│   ├── billing/                  # Subscription management
│   ├── pricing/                  # Pricing page
│   └── settings/                 # User settings
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   └── ui/                       # Reusable UI components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Database client
│   ├── stripe.ts                 # Stripe client
│   └── config.ts                 # App configuration
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database models
│   └── seed.ts                   # Initial data seeding
├── scripts/                      # Automation scripts
│   ├── setup.sh                  # Main setup script
│   ├── setup-database.js         # Database setup
│   └── validate-env.js           # Environment validation
└── docs/                         # Documentation
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App Configuration
APP_ID="app1"                     # Unique identifier for this app
APP_NAME="AI App 1"               # Display name
APP_DOMAIN="app1.mywebsite.com"   # Production domain

# Admin Configuration
ADMIN_EMAIL="admin@mywebsite.com"           # App admin email
MASTER_ADMIN_EMAIL="admin@mywebsite.com"    # Master admin email
IS_MASTER_ADMIN="false"                     # true for master dashboard
MASTER_ADMIN_URL="https://admin.mywebsite.com"  # Master admin URL
```

### App Types

#### Master Admin Dashboard
```bash
APP_ID="master-admin"
APP_NAME="Master Admin Dashboard"
APP_DOMAIN="admin.mywebsite.com"
IS_MASTER_ADMIN="true"
```

#### Individual AI App
```bash
APP_ID="app1"
APP_NAME="AI App 1"
APP_DOMAIN="app1.mywebsite.com"
IS_MASTER_ADMIN="false"
```

## 🗄️ Database Schema

### Core Models

#### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // Hashed with bcrypt
  emailVerified DateTime?
  image         String?
  appId         String    @default("default")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  subscriptions Subscription[]
}
```

#### Subscription Model
```prisma
model Subscription {
  id                String   @id @default(cuid())
  userId            String
  stripeCustomerId  String?  @unique
  stripeSubscriptionId String? @unique
  stripePriceId     String?
  stripeCurrentPeriodEnd DateTime?
  status            String
  appId             String   @default("default")
  
  user              User     @relation(fields: [userId], references: [id])
}
```

#### Product & Price Models
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  active      Boolean  @default(true)
  appId       String   @default("default")
  
  prices      Price[]
}

model Price {
  id          String   @id @default(cuid())
  productId   String
  stripePriceId String @unique
  unitAmount  Int
  currency    String   @default("usd")
  interval    String?  // month, year
  active      Boolean  @default(true)
  
  product     Product  @relation(fields: [productId], references: [id])
}
```

## 🔐 Authentication System

### NextAuth Configuration
- **Providers**: Credentials (email/password) + Google OAuth
- **Strategy**: JWT sessions
- **Database**: Prisma adapter
- **Password Hashing**: bcryptjs
- **CSRF Protection**: Built-in NextAuth protection

### Authentication Flow
1. **Registration**: `/api/auth/register` → Hash password → Create user
2. **Login**: NextAuth credentials provider → Verify password → Create session
3. **OAuth**: Google provider → Create/link account
4. **Session Management**: JWT tokens with user data

### Protected Routes
- `/dashboard` - User dashboard
- `/billing` - Subscription management
- `/settings` - User settings
- `/admin` - Admin dashboard (admin users only)

## 💳 Payment System (Stripe)

### Subscription Management
- **Checkout**: `/api/stripe/create-checkout-session`
- **Customer Portal**: `/api/stripe/create-portal-session`
- **Webhooks**: `/api/stripe/webhook` (handles subscription events)
- **Cancellation**: `/api/stripe/cancel-subscription`

### Stripe Integration
- **Products**: Managed via Prisma (seeded on setup)
- **Prices**: Dynamic pricing with Stripe Price IDs
- **Webhooks**: Real-time subscription status updates
- **Customer Portal**: Self-service billing management

## 👑 Admin System

### Admin Types

#### Master Admin
- **Access**: All users across all apps
- **Features**: Global user management, cross-app analytics
- **Configuration**: `IS_MASTER_ADMIN="true"`

#### App-Specific Admin
- **Access**: Users only within their app
- **Features**: App-specific user management
- **Configuration**: `IS_MASTER_ADMIN="false"`

### Admin Features
- **User Management**: View, edit, suspend, delete users
- **Password Reset**: Generate new passwords for users
- **Subscription Management**: View and modify subscriptions
- **Analytics**: User counts, subscription stats
- **Multi-App Navigation**: Links to other apps (master admin only)

### Admin API Endpoints
- `GET /api/admin/users` - List users
- `GET /api/admin/users/[userId]` - User details
- `POST /api/admin/users/[userId]` - User actions
- `GET /api/admin/subscriptions/[userId]` - User subscriptions

## 🚀 Deployment Process

### 1. Template Setup
```bash
# Clone template
git clone https://github.com/phillipq/nextjs-enterprise.git my-app
cd my-app

# Install dependencies
pnpm install

# Setup database and environment
pnpm setup
```

### 2. Create New Repository
```bash
# Remove git history
rm -rf .git
git init

# Create new GitHub repository
# (via GitHub web interface)

# Connect to new repo
git remote add origin git@github.com:phillipq/my-app.git
git add .
git commit -m "Initial setup"
git push -u origin main
```

### 3. Configure Environment
- Copy `.env.local` from template
- Update app-specific variables
- Set up Supabase database
- Configure Stripe keys
- Set up Google OAuth (optional)

### 4. Deploy to Vercel
- Connect GitHub repository
- Set custom domain
- Configure environment variables
- Deploy

## 🛠️ Development Commands

### Setup & Installation
```bash
pnpm install              # Install dependencies
pnpm setup               # Complete setup (install + db + seed)
pnpm validate            # Validate environment variables
pnpm verify              # Verify complete setup
```

### Database Management
```bash
pnpm db:generate         # Generate Prisma client
pnpm db:push            # Push schema to database
pnpm db:migrate         # Create and run migrations
pnpm db:studio          # Open Prisma Studio
pnpm db:seed            # Seed database with initial data
```

### Development
```bash
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm type-check         # Run TypeScript checks
```

## 🔧 Customization Guide

### Adding New Features
1. **API Routes**: Add to `app/api/`
2. **Pages**: Add to `app/`
3. **Components**: Add to `components/`
4. **Database**: Update `prisma/schema.prisma`
5. **Configuration**: Update `lib/config.ts`

### Multi-App Considerations
- Always use `appId` for data isolation
- Check `IS_MASTER_ADMIN` for admin features
- Use `APP_CONFIG` for app-specific settings
- Test with different `APP_ID` values

### Security Best Practices
- Never commit `.env.local`
- Use strong `NEXTAUTH_SECRET`
- Validate all API inputs
- Implement rate limiting
- Use HTTPS in production

## 📊 Monitoring & Analytics

### Built-in Analytics
- User registration counts
- Subscription statistics
- App-specific metrics
- Admin dashboard analytics

### Recommended Additions
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- User behavior tracking
- Business metrics dashboard

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
pnpm db:studio
```

#### Authentication Issues
- Verify `NEXTAUTH_URL` matches deployment domain
- Check `NEXTAUTH_SECRET` is set
- Ensure Google OAuth credentials are correct

#### Stripe Integration
- Verify webhook endpoint is configured
- Check Stripe keys are correct environment
- Test webhook events in Stripe dashboard

#### Multi-App Issues
- Verify `APP_ID` is unique per deployment
- Check `IS_MASTER_ADMIN` configuration
- Ensure database has proper `appId` isolation

## 📚 Additional Resources

### Documentation Files
- `README-ENHANCED.md` - Enhanced setup guide
- `MULTI-APP-ADMIN-GUIDE.md` - Admin system guide
- `QUICK-START.md` - Quick start instructions
- `SETUP-GUIDE.md` - Detailed setup guide
- `ARCHITECTURE.md` - System architecture
- `ADMIN-GUIDE.md` - Admin features guide
- `CHANGELOG.md` - Version history

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 🎯 Quick Reference

### Environment Variables Checklist
- [ ] `DATABASE_URL` (Supabase)
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `APP_ID`
- [ ] `APP_NAME`
- [ ] `APP_DOMAIN`
- [ ] `ADMIN_EMAIL`
- [ ] `MASTER_ADMIN_EMAIL`
- [ ] `IS_MASTER_ADMIN`
- [ ] `MASTER_ADMIN_URL`

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Stripe webhooks configured
- [ ] Custom domain set up
- [ ] SSL certificate active
- [ ] Admin user created
- [ ] Test user registration
- [ ] Test subscription flow

---

**This template provides a complete foundation for AI applications with enterprise-grade user management, billing, and admin capabilities. Each deployment is isolated by `appId` while sharing centralized admin oversight.**
