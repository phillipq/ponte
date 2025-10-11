# 🚀 Quick Start Guide

Get your AI app template running in 5 minutes!

## 📋 **Prerequisites**

- Node.js 20+
- Supabase account (free)
- Stripe account (free)

## ⚡ **5-Minute Setup**

### **Step 1: Clone & Install**
```bash
git clone <your-template-repo>
cd app-template
pnpm install
```

### **Step 2: Configure Environment**
```bash
# Copy environment template
cp env.template .env.local

# Edit with your credentials
nano .env.local
```

### **Step 3: Get Supabase Connection**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project or select existing
3. Go to **Settings** → **Database** → **Connection string**
4. Copy the **URI** connection string (NOT pooled)
5. Paste into `.env.local` as `DATABASE_URL`

### **Step 4: Get Stripe Keys**
1. Go to [stripe.com/dashboard](https://stripe.com/dashboard)
2. Go to **Developers** → **API keys**
3. Copy **Publishable key** and **Secret key** (test keys)
4. Paste into `.env.local`

### **Step 5: Run Setup**
```bash
# Validate your environment
pnpm validate

# Run complete setup (handles Supabase issues automatically)
pnpm setup

# Start development server
pnpm dev
```

## 🎯 **That's It!**

Your app is now running at `http://localhost:3000`

## 🔧 **Troubleshooting**

### **Supabase Connection Issues**
The setup script automatically handles:
- ✅ URL encoding of special characters
- ✅ Password encoding
- ✅ Connection string validation

### **Common Issues**

**"Environment variable not found"**
```bash
# Make sure .env.local exists and has DATABASE_URL
pnpm validate
```

**"Invalid connection string"**
```bash
# Use the URI connection string, not pooled
# Make sure password doesn't have unencoded special characters
```

**"Database schema not found"**
```bash
# Run database setup
pnpm db:setup
```

## 📊 **Verify Setup**

```bash
# Check environment
pnpm validate

# Check database
pnpm verify

# View database in browser
pnpm db:studio
```

## 🚀 **Next Steps**

1. **Test Registration**: Go to `http://localhost:3000/auth/signup`
2. **Test Login**: Go to `http://localhost:3000/auth/signin`
3. **Check Dashboard**: Go to `http://localhost:3000/dashboard`
4. **View Pricing**: Go to `http://localhost:3000/pricing`

## 🎨 **Customize Your App**

Edit these files to customize:
- `components/Navigation.tsx` - App name and branding
- `app/pricing/page.tsx` - Pricing plans
- `lib/config.ts` - App configuration
- `styles/` - Colors and styling

## 📚 **Full Documentation**

- [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Detailed setup instructions
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Multi-app architecture
- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - Testing procedures

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
