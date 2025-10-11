# 🏗️ Multi-App Architecture Guide

## Overview

This template supports multiple AI applications using a **single Supabase database** with app-specific data isolation through the `appId` field.

## 🎯 **Recommended Architecture: Single Database + App Field**

### **Why This Approach?**

✅ **Cost-Effective**: One database subscription for all apps
✅ **Easy Management**: Single point of maintenance
✅ **Cross-App Analytics**: User behavior across all applications
✅ **Shared User Base**: Users can access multiple apps with same account
✅ **Simplified Deployment**: Same connection string for all apps

### **Database Schema**

```sql
-- Users table with app isolation
CREATE TABLE "User" (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT UNIQUE,
  appId         TEXT DEFAULT 'default',  -- App identifier
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW()
);

-- Subscriptions with app isolation
CREATE TABLE "Subscription" (
  id                TEXT PRIMARY KEY,
  userId            TEXT UNIQUE,
  appId             TEXT DEFAULT 'default',  -- App identifier
  stripeCustomerId  TEXT UNIQUE,
  status            TEXT,
  createdAt         TIMESTAMP DEFAULT NOW()
);

-- Products with app isolation
CREATE TABLE "Product" (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  appId       TEXT DEFAULT 'default',  -- App identifier
  active      BOOLEAN DEFAULT true,
  createdAt   TIMESTAMP DEFAULT NOW()
);
```

## 🚀 **Deployment Strategy**

### **For Each New App:**

1. **Set App Configuration**:
```env
APP_ID="ai-chatbot"           # Unique app identifier
APP_NAME="AI Chatbot Pro"     # Display name
APP_DOMAIN="chatbot.yourdomain.com"  # App domain
```

2. **Use Same Database**: All apps share the same Supabase database
3. **App-Specific Data**: Data is automatically filtered by `appId`

### **Example App Deployments:**

```bash
# App 1: AI Chatbot
APP_ID="ai-chatbot"
APP_NAME="AI Chatbot Pro"
APP_DOMAIN="chatbot.yourdomain.com"

# App 2: Document Analyzer  
APP_ID="doc-analyzer"
APP_NAME="Document Analyzer"
APP_DOMAIN="docs.yourdomain.com"

# App 3: Code Assistant
APP_ID="code-assistant"
APP_NAME="Code Assistant Pro"
APP_DOMAIN="code.yourdomain.com"
```

## 🔒 **Data Isolation**

### **Automatic Filtering**

All database queries automatically include app filtering:

```typescript
// User queries are automatically filtered by appId
const users = await prisma.user.findMany({
  where: { appId: APP_CONFIG.APP_ID }
})

// Subscriptions are app-specific
const subscriptions = await prisma.subscription.findMany({
  where: { appId: APP_CONFIG.APP_ID }
})
```

### **Cross-App Data Access**

```typescript
// Get user across all apps (admin function)
const allUsers = await prisma.user.findMany({
  where: { email: "user@example.com" }
})

// Get user's subscriptions across all apps
const userSubscriptions = await prisma.subscription.findMany({
  where: { userId: userId }
})
```

## 📊 **Supabase Branches Usage**

### **Development Workflow**

```bash
# Create development branch
supabase branches create dev-branch

# Create staging branch
supabase branches create staging-branch

# Switch between branches
supabase branches switch dev-branch
supabase branches switch staging-branch
```

### **Branch Strategy**

- **Main**: Production database
- **Dev**: Development and testing
- **Staging**: Pre-production testing

## 💰 **Cost Analysis**

### **Single Database Approach**
- **Supabase**: $25/month (Pro plan)
- **Total**: $25/month for unlimited apps

### **Multiple Database Approach**
- **Supabase**: $25/month per app
- **5 Apps**: $125/month
- **10 Apps**: $250/month

**Savings**: 80-90% cost reduction with single database

## 🔧 **Implementation Examples**

### **App-Specific User Registration**

```typescript
// lib/auth.ts
export async function createUser(userData: CreateUserData) {
  return await prisma.user.create({
    data: {
      ...userData,
      appId: APP_CONFIG.APP_ID  // Automatically set
    }
  })
}
```

### **App-Specific Subscriptions**

```typescript
// lib/stripe.ts
export async function createSubscription(userId: string, priceId: string) {
  return await prisma.subscription.create({
    data: {
      userId,
      priceId,
      appId: APP_CONFIG.APP_ID,  // App-specific
      status: 'active'
    }
  })
}
```

### **Cross-App Analytics**

```typescript
// Get user's total spending across all apps
export async function getUserTotalSpending(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { product: true }
  })
  
  return subscriptions.reduce((total, sub) => {
    return total + (sub.product?.price || 0)
  }, 0)
}
```

## 🚨 **Security Considerations**

### **Data Isolation**
- ✅ App-specific data filtering
- ✅ Row-level security (RLS) in Supabase
- ✅ Environment-based app identification

### **Access Control**
```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Create policies for app isolation
CREATE POLICY "Users can only see their app data" ON "User"
  FOR ALL USING (appId = current_setting('app.current_app_id'));
```

## 📈 **Scaling Strategy**

### **Horizontal Scaling**
- Add more app instances with same `APP_ID`
- Load balance across multiple servers
- Shared database handles all traffic

### **Vertical Scaling**
- Upgrade Supabase plan as needed
- Add read replicas for heavy read workloads
- Implement caching for frequently accessed data

## 🎯 **Best Practices**

1. **Always use `APP_ID`** in environment variables
2. **Filter queries by app** using the config helper
3. **Use Supabase branches** for development
4. **Monitor database usage** across all apps
5. **Implement proper RLS policies** for security

## 🔄 **Migration Strategy**

### **From Single App to Multi-App**

1. Add `appId` field to existing tables
2. Set default `appId` for existing data
3. Update all queries to include app filtering
4. Deploy with new app configurations

### **Database Migration**

```bash
# Add appId fields
pnpm db:migrate

# Update existing data
pnpm db:seed --update-existing
```

---

This architecture provides the perfect balance of **cost-effectiveness**, **data isolation**, and **management simplicity** for your multi-app AI platform.

