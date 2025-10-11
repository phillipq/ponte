# Multi-App Admin Architecture Guide

This guide explains how to set up a centralized admin system for managing multiple AI applications.

## 🏗️ Architecture Overview

### Current Setup
- **Each app** has its own admin dashboard
- **Hardcoded admin email** in each deployment
- **Isolated user management** per app

### Recommended Setup: Centralized Admin
- **One master admin dashboard** (e.g., `admin.mywebsite.com`)
- **Manages all AI apps** from one place
- **Shared user base** across all apps
- **Centralized subscription management**

## 🚀 Setup Instructions

### 1. Create Master Admin Dashboard

Create a dedicated admin app with these environment variables:

```bash
# Master Admin App (.env.local)
APP_ID="master-admin"
APP_NAME="Master Admin Dashboard"
APP_DOMAIN="admin.mywebsite.com"
ADMIN_EMAIL="admin@mywebsite.com"
MASTER_ADMIN_EMAIL="admin@mywebsite.com"
IS_MASTER_ADMIN="true"
MASTER_ADMIN_URL="https://admin.mywebsite.com"
```

### 2. Configure Individual AI Apps

For each AI app, use these environment variables:

```bash
# AI App (.env.local)
APP_ID="ai-chatbot"  # Unique for each app
APP_NAME="AI Chatbot Pro"
APP_DOMAIN="chatbot.mywebsite.com"
ADMIN_EMAIL="admin@mywebsite.com"  # Same as master admin
MASTER_ADMIN_EMAIL="admin@mywebsite.com"  # Same across all apps
IS_MASTER_ADMIN="false"  # Only master admin app is true
MASTER_ADMIN_URL="https://admin.mywebsite.com"  # Points to master admin
```

## 🔐 Admin Access Levels

### Master Admin
- **Access**: All apps and users
- **Features**: 
  - View all users across all apps
  - Manage subscriptions globally
  - App analytics across all apps
  - User management across all apps

### App-Specific Admin
- **Access**: Only their specific app
- **Features**:
  - View users for their app only
  - Manage subscriptions for their app
  - App-specific analytics
  - Link back to master admin

## 📊 Database Structure

The system uses a single database with `appId` field to separate data:

```sql
-- Users table with app isolation
CREATE TABLE User (
  id            String    @id @default(cuid())
  email         String    @unique
  appId         String    @default("default")  -- Separates apps
  -- ... other fields
)

-- Subscriptions with app isolation
CREATE TABLE Subscription (
  id            String    @id @default(cuid())
  userId        String    @unique
  appId         String    @default("default")  -- Separates apps
  -- ... other fields
)
```

## 🛠️ Deployment Strategy

### Option 1: Single Vercel Project (Recommended)
1. **Master Admin**: Deploy to `admin.mywebsite.com`
2. **AI Apps**: Deploy to `app1.mywebsite.com`, `app2.mywebsite.com`, etc.
3. **Same database**: All apps share the same Supabase database
4. **Same admin user**: One admin account manages all apps

### Option 2: Multiple Vercel Projects
1. **Separate deployments** for each app
2. **Shared database** across all projects
3. **Consistent admin email** across all projects

## 🔧 Configuration Examples

### Master Admin Dashboard
```bash
# Deploy to: admin.mywebsite.com
APP_ID="master-admin"
APP_NAME="Master Admin Dashboard"
IS_MASTER_ADMIN="true"
MASTER_ADMIN_EMAIL="admin@mywebsite.com"
```

### AI Chatbot App
```bash
# Deploy to: chatbot.mywebsite.com
APP_ID="ai-chatbot"
APP_NAME="AI Chatbot Pro"
IS_MASTER_ADMIN="false"
MASTER_ADMIN_EMAIL="admin@mywebsite.com"
MASTER_ADMIN_URL="https://admin.mywebsite.com"
```

### Document Analyzer App
```bash
# Deploy to: docs.mywebsite.com
APP_ID="doc-analyzer"
APP_NAME="Document Analyzer Pro"
IS_MASTER_ADMIN="false"
MASTER_ADMIN_EMAIL="admin@mywebsite.com"
MASTER_ADMIN_URL="https://admin.mywebsite.com"
```

## 🎯 Benefits

### For You (Admin)
- **Single login** to manage all apps
- **Unified user base** across all applications
- **Centralized subscription management**
- **Cross-app analytics** and insights
- **Simplified user support**

### For Users
- **Single account** works across all your AI apps
- **Unified subscription** across all services
- **Seamless experience** between apps
- **Single billing** for all services

## 🔄 Migration Path

### From Current Setup
1. **Keep existing apps** running
2. **Create master admin dashboard** with `IS_MASTER_ADMIN="true"`
3. **Update existing apps** to use new admin configuration
4. **Test admin access** across all apps
5. **Gradually migrate** users to unified system

### Database Migration
No database changes needed! The `appId` field already separates apps, and the new admin system works with the existing structure.

## 🚨 Security Considerations

### Admin Access
- **Master admin email** should be your personal email
- **Strong password** for admin account
- **Two-factor authentication** recommended
- **Regular password changes**

### App Isolation
- **Users can only see** their app's data (unless master admin)
- **API routes respect** app boundaries
- **Database queries** filter by `appId`

## 📝 Quick Start Checklist

- [ ] Create master admin dashboard deployment
- [ ] Set `IS_MASTER_ADMIN="true"` for master admin
- [ ] Set `IS_MASTER_ADMIN="false"` for all AI apps
- [ ] Use same `MASTER_ADMIN_EMAIL` across all apps
- [ ] Test admin access on master dashboard
- [ ] Test app-specific admin access
- [ ] Verify user data isolation
- [ ] Test cross-app user management

## 🆘 Troubleshooting

### Admin Can't Access Dashboard
- Check `ADMIN_EMAIL` matches your login email
- Verify `IS_MASTER_ADMIN` is set correctly
- Ensure user exists in database

### Users See Wrong App Data
- Check `APP_ID` is unique for each app
- Verify database queries filter by `appId`
- Check admin access level (master vs app-specific)

### Cross-App Navigation Issues
- Verify `MASTER_ADMIN_URL` points to correct domain
- Check CORS settings for cross-domain requests
- Ensure SSL certificates are valid

## 📞 Support

If you need help setting up the multi-app admin system:
1. Check the configuration examples above
2. Verify environment variables are set correctly
3. Test with a single app first
4. Gradually add more apps to the system
