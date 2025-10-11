# 🧪 Multi-App Testing Guide

This guide will help you test the multi-app functionality with a single Supabase database.

## 📋 **Prerequisites**

- Supabase project set up
- Environment variables configured
- Database migrations completed

## 🚀 **Step 1: Initial Setup**

### **1.1 Configure Environment**
```bash
# Copy environment template
cp env.template .env.local

# Edit with your Supabase credentials
nano .env.local
```

**Required for testing:**
```env
APP_ID="test-app-1"
APP_NAME="Test App 1"
APP_DOMAIN="localhost:3000"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXTAUTH_SECRET="your-secret-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### **1.2 Run Setup Script**
```bash
./scripts/test-multi-app.sh
```

## 🎯 **Step 2: Test Single App Instance**

### **2.1 Start Development Server**
```bash
pnpm dev
```

### **2.2 Test Basic Functionality**
1. **Registration**: Go to `http://localhost:3000/auth/signup`
   - Create user: `test1@example.com`
   - **Expected**: User created with `appId: "test-app-1"`

2. **Login**: Go to `http://localhost:3000/auth/signin`
   - Login with `test1@example.com`
   - **Expected**: Redirect to dashboard

3. **Dashboard**: Check `http://localhost:3000/dashboard`
   - **Expected**: Shows user data and subscription status

### **2.3 Verify Database Data**
```bash
# Open Prisma Studio
pnpm db:studio
```

**Check in Prisma Studio:**
- User table: Should show user with `appId: "test-app-1"`
- Subscription table: Should show subscription with `appId: "test-app-1"`

## 🔄 **Step 3: Test Multi-App Setup**

### **3.1 Create Second App Instance**

Create a new terminal and set up second app:

```bash
# Create new directory for second app
mkdir ../test-app-2
cd ../test-app-2

# Copy template
cp -r ../app-template/* .

# Create new environment file
cp env.template .env.local
```

**Edit `.env.local` for second app:**
```env
APP_ID="test-app-2"
APP_NAME="Test App 2"
APP_DOMAIN="localhost:3001"
# ... same database and other settings
```

### **3.2 Start Second App**
```bash
# Install dependencies
pnpm install

# Start on different port
pnpm dev --port 3001
```

### **3.3 Test App Isolation**

#### **Test 1: User Registration in App 2**
1. Go to `http://localhost:3001/auth/signup`
2. Create user: `test2@example.com`
3. **Expected**: User created with `appId: "test-app-2"`

#### **Test 2: Cross-App User Access**
1. Try logging into App 2 with `test1@example.com` (from App 1)
2. **Expected**: Should work (same user, different app context)

#### **Test 3: App-Specific Data**
1. Check Prisma Studio
2. **Expected**: 
   - `test1@example.com` has `appId: "test-app-1"`
   - `test2@example.com` has `appId: "test-app-2"`

## 🗄️ **Step 4: Database Testing**

### **4.1 Test App-Specific Queries**

Create a test script to verify data isolation:

```bash
# Create test script
cat > test-db-isolation.js << 'EOF'
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAppIsolation() {
  console.log('🧪 Testing App Data Isolation...')
  
  // Test App 1 users
  const app1Users = await prisma.user.findMany({
    where: { appId: 'test-app-1' }
  })
  console.log(`App 1 users: ${app1Users.length}`)
  
  // Test App 2 users
  const app2Users = await prisma.user.findMany({
    where: { appId: 'test-app-2' }
  })
  console.log(`App 2 users: ${app2Users.length}`)
  
  // Test all users
  const allUsers = await prisma.user.findMany()
  console.log(`Total users: ${allUsers.length}`)
  
  // Verify isolation
  if (app1Users.length + app2Users.length === allUsers.length) {
    console.log('✅ Data isolation working correctly!')
  } else {
    console.log('❌ Data isolation issue detected!')
  }
}

testAppIsolation().catch(console.error)
EOF

# Run test
node test-db-isolation.js
```

### **4.2 Test Subscription Isolation**

```bash
# Create subscription test
cat > test-subscriptions.js << 'EOF'
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSubscriptionIsolation() {
  console.log('🧪 Testing Subscription Isolation...')
  
  // Get subscriptions by app
  const app1Subs = await prisma.subscription.findMany({
    where: { appId: 'test-app-1' }
  })
  
  const app2Subs = await prisma.subscription.findMany({
    where: { appId: 'test-app-2' }
  })
  
  console.log(`App 1 subscriptions: ${app1Subs.length}`)
  console.log(`App 2 subscriptions: ${app2Subs.length}`)
  
  // Test cross-app user subscriptions
  const user1 = await prisma.user.findFirst({
    where: { email: 'test1@example.com' }
  })
  
  if (user1) {
    const user1Subs = await prisma.subscription.findMany({
      where: { userId: user1.id }
    })
    console.log(`User 1 subscriptions across apps: ${user1Subs.length}`)
  }
}

testSubscriptionIsolation().catch(console.error)
EOF

# Run test
node test-subscriptions.js
```

## 🔍 **Step 5: API Testing**

### **5.1 Test App-Specific API Endpoints**

```bash
# Test registration API for App 1
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test 1","email":"apitest1@example.com","password":"password123"}'

# Test registration API for App 2
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test 2","email":"apitest2@example.com","password":"password123"}'
```

### **5.2 Test Cross-App User Access**

```bash
# Test if user from App 1 can access App 2
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Cross App Test","email":"test1@example.com","password":"password123"}'
```

**Expected**: Should return "User with this email already exists" (same user, different app)

## ✅ **Step 6: Verification Checklist**

### **Database Verification**
- [ ] Users created with correct `appId`
- [ ] Subscriptions isolated by app
- [ ] Products isolated by app
- [ ] Cross-app queries work correctly

### **Application Verification**
- [ ] App 1 runs on port 3000
- [ ] App 2 runs on port 3001
- [ ] Each app shows correct branding
- [ ] User registration works in both apps
- [ ] Login works in both apps
- [ ] Dashboard shows app-specific data

### **API Verification**
- [ ] Registration API works for both apps
- [ ] Login API works for both apps
- [ ] App-specific data filtering works
- [ ] Cross-app user access works

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Database Connection Issues**
   - Verify Supabase project is active
   - Check connection string format
   - Ensure database password is correct

2. **App ID Not Working**
   - Check environment variables are set
   - Verify `APP_ID` is unique for each app
   - Restart development servers

3. **Data Isolation Issues**
   - Check Prisma schema includes `appId` fields
   - Verify migrations ran successfully
   - Check queries include app filtering

### **Debug Commands**

```bash
# Check environment variables
echo $APP_ID

# Check database connection
pnpm db:studio

# Check Prisma client
pnpm db:generate

# Reset database (if needed)
pnpm db:push --force-reset
```

## 🎯 **Success Criteria**

Your multi-app setup is working when:
- [ ] Two apps run simultaneously on different ports
- [ ] Each app has isolated user data
- [ ] Users can access multiple apps with same account
- [ ] Database shows correct `appId` for all records
- [ ] API endpoints work for both apps
- [ ] No data leakage between apps

## 🚀 **Next Steps**

Once testing is complete:
1. **Document any issues** found
2. **Fix any problems** identified
3. **Create production deployment** guide
4. **Set up CI/CD** for multi-app deployments

---

**Your multi-app template is ready for production!** 🎉
