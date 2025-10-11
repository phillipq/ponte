#!/usr/bin/env node

// Verification script for multi-app setup
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifySetup() {
  console.log('🔍 Verifying Multi-App Setup...\n')
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected successfully')
    
    // Check if tables exist
    console.log('\n2. Checking database schema...')
    const userCount = await prisma.user.count()
    const subscriptionCount = await prisma.subscription.count()
    const productCount = await prisma.product.count()
    
    console.log(`   📊 Users: ${userCount}`)
    console.log(`   📊 Subscriptions: ${subscriptionCount}`)
    console.log(`   📊 Products: ${productCount}`)
    
    // Check app isolation
    console.log('\n3. Testing app isolation...')
    const appIds = await prisma.user.findMany({
      select: { appId: true },
      distinct: ['appId']
    })
    
    console.log(`   🏷️  Unique App IDs: ${appIds.map(a => a.appId).join(', ')}`)
    
    // Test app-specific queries
    console.log('\n4. Testing app-specific queries...')
    for (const app of appIds) {
      const count = await prisma.user.count({
        where: { appId: app.appId }
      })
      console.log(`   📱 App "${app.appId}": ${count} users`)
    }
    
    console.log('\n✅ Setup verification complete!')
    console.log('\n🎯 Next steps:')
    console.log('   1. Start development server: pnpm dev')
    console.log('   2. Test registration: http://localhost:3000/auth/signup')
    console.log('   3. Check Prisma Studio: pnpm db:studio')
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check your .env.local file')
    console.log('   2. Verify DATABASE_URL is correct')
    console.log('   3. Run: pnpm db:generate')
    console.log('   4. Run: pnpm db:migrate')
  } finally {
    await prisma.$disconnect()
  }
}

verifySetup()
