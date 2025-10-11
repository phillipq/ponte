# Next.js Enterprise Boilerplate with Authentication & Stripe Integration

A production-ready template for building standalone AI applications with Next.js, featuring user authentication, subscription management, and payment processing.

## 🚀 New Features Added

### Authentication System
- **NextAuth.js Integration**: Complete authentication system with multiple providers
- **User Management**: Registration, login, and session management
- **Protected Routes**: Server-side and client-side route protection
- **OAuth Support**: Google OAuth integration (easily extensible for other providers)
- **Password Security**: Bcrypt hashing for secure password storage

### Payment & Subscription Management
- **Stripe Integration**: Complete payment processing setup
- **Subscription Management**: Create, update, and cancel subscriptions
- **Customer Portal**: Self-service billing management
- **Webhook Handling**: Real-time subscription status updates
- **Multiple Plans**: Free, Pro, and Enterprise tier support

### Database & ORM
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL Ready**: Optimized for production databases
- **User Schema**: Complete user and subscription data models
- **Migrations**: Database schema versioning and management

### Admin Dashboard
- **Centralized Management**: Manage users across all AI applications
- **Multi-App Architecture**: Single admin dashboard for all your AI apps
- **User Operations**: Delete, suspend, verify users
- **Subscription Control**: Cancel, reactivate, refund subscriptions
- **Free Trial Management**: Grant trials to free users
- **Analytics**: User distribution and revenue insights
- **Bulk Actions**: Perform operations on multiple users
- **App Isolation**: Each app manages its own users while sharing admin access

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Stripe account
- Google OAuth credentials (optional)

## ⚡ **Quick Start (5 Minutes)**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd app-template
pnpm install

# 2. Configure environment
cp env.template .env.local
# Edit .env.local with your Supabase and Stripe credentials

# 3. Run setup (handles Supabase issues automatically)
pnpm setup

# 4. Start development server
pnpm dev
```

**That's it!** Your app is running at `http://localhost:3000`

**Admin Dashboard**: `http://localhost:3000/admin` (admin users only)

📚 **For detailed instructions, see [QUICK-START.md](./QUICK-START.md)**

## 👨‍💼 **Admin Dashboard**

The admin dashboard provides centralized management of users and subscriptions across all your AI applications:

### **Features**
- **User Management**: Delete, suspend, verify users across all apps
- **Subscription Control**: Cancel, reactivate, refund subscriptions
- **Free Trial Management**: Grant trials to free users (1-90 days)
- **Analytics**: User distribution, revenue insights, app performance
- **Bulk Actions**: Perform operations on multiple users

### **Setup**
1. **Update Admin Email**: Replace `admin@yourdomain.com` in admin files with your email
2. **Register Admin User**: Sign up with your admin email
3. **Access Dashboard**: Navigate to `/admin`

📚 **For complete admin guide, see [ADMIN-GUIDE.md](./ADMIN-GUIDE.md)**

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database with initial data
pnpm db:seed
```

### 4. Stripe Configuration

1. Create products and prices in your Stripe dashboard
2. Update the price IDs in `app/pricing/page.tsx`
3. Configure webhook endpoints:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `customer.subscription.*`, `invoice.payment_*`

### 5. Start Development Server

```bash
pnpm dev
```

## 🏗️ Project Structure

```
app-template/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   └── stripe/               # Stripe integration
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Protected dashboard
│   ├── billing/                  # Billing management
│   └── pricing/                  # Pricing page
├── components/                   # Reusable components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   └── stripe.ts                 # Stripe configuration
├── prisma/                       # Database schema and migrations
└── styles/                       # Global styles
```

## 🏗️ Multi-App Architecture

This template supports deploying multiple AI applications with a shared user base:

- **Single Database**: All apps share the same PostgreSQL database
- **App Isolation**: Each app has its own `appId` for data separation
- **Shared Users**: Users can access multiple apps with the same account
- **Unified Subscriptions**: Single subscription works across all apps
- **Centralized Admin**: One admin dashboard manages all applications

### 🎯 Admin System Options

#### Option 1: Centralized Admin (Recommended)
- **Master Admin Dashboard**: One dashboard at `admin.mywebsite.com`
- **Manages All Apps**: Single login to manage all AI applications
- **App-Specific Access**: Each app can have its own admin with limited scope
- **Unified User Base**: Shared users across all applications

#### Option 2: Per-App Admin
- **Individual Admins**: Each app has its own admin dashboard
- **Isolated Management**: Separate admin access per application
- **Independent Users**: Users are separate per application

See [MULTI-APP-ADMIN-GUIDE.md](./MULTI-APP-ADMIN-GUIDE.md) for detailed setup instructions.

## 🔐 Authentication Flow

### User Registration
1. User fills out registration form
2. Password is hashed with bcrypt
3. User account is created in database
4. Automatic sign-in after successful registration

### User Login
1. Credentials are validated against database
2. JWT session is created
3. User is redirected to dashboard

### OAuth Integration
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. User authorizes application
4. Account is created/linked automatically

## 💳 Payment Integration

### Subscription Flow
1. User selects a plan on pricing page
2. Stripe Checkout session is created
3. User completes payment
4. Webhook updates subscription status
5. User gains access to premium features

### Billing Management
- Customer portal for self-service billing
- Subscription cancellation
- Payment method updates
- Invoice history

## 🎯 Key Features

### User Management
- ✅ User registration and authentication
- ✅ Password hashing and security
- ✅ Session management
- ✅ OAuth provider integration
- ✅ Protected routes and middleware

### Subscription Management
- ✅ Multiple subscription tiers
- ✅ Stripe payment processing
- ✅ Webhook handling for real-time updates
- ✅ Customer portal integration
- ✅ Subscription cancellation

### Database & ORM
- ✅ Prisma ORM with type safety
- ✅ PostgreSQL optimization
- ✅ Database migrations
- ✅ Seed data for development

### Security
- ✅ Environment variable validation
- ✅ Secure password storage
- ✅ CSRF protection
- ✅ SQL injection prevention

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://yourdomain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm e2e:headless

# Run tests with coverage
pnpm test:coverage
```

## 📊 Monitoring & Analytics

- **OpenTelemetry**: Built-in observability
- **Health Checks**: Kubernetes-compatible endpoints
- **Bundle Analysis**: Performance monitoring
- **Lighthouse**: Performance scoring

## 🔧 Customization

### Adding New Authentication Providers
1. Install provider package
2. Add provider to `lib/auth.ts`
3. Update environment variables
4. Add provider button to auth pages

### Creating New Subscription Tiers
1. Create product in Stripe dashboard
2. Add price to database seed
3. Update pricing page
4. Configure feature access logic

### Extending User Schema
1. Update Prisma schema
2. Run migration
3. Update registration form
4. Modify user dashboard

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Documentation](https://stripe.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example implementations

---

**Ready to build your next AI application?** This template provides everything you need to get started with user management, payments, and a solid foundation for your standalone AI apps.
