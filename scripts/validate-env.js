#!/usr/bin/env node

// Environment validation script
require('dotenv').config({ path: '.env.local' })

function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n')
  
  const required = [
    'APP_ID',
    'APP_NAME', 
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_MAPS_API_KEY'
  ]
  
  const optional = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_MAPS_GEOCODING_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ]
  
  let hasErrors = false
  
  // Check required variables
  console.log('📋 Required variables:')
  required.forEach(key => {
    if (process.env[key]) {
      // Mask sensitive values
      const value = key.includes('SECRET') || key.includes('KEY') || key.includes('URL') 
        ? '***' + process.env[key].slice(-4)
        : process.env[key]
      console.log(`   ✅ ${key}: ${value}`)
    } else {
      console.log(`   ❌ ${key}: Missing`)
      hasErrors = true
    }
  })
  
  // Check optional variables
  console.log('\n📋 Optional variables:')
  optional.forEach(key => {
    if (process.env[key]) {
      const value = key.includes('SECRET') || key.includes('KEY')
        ? '***' + process.env[key].slice(-4)
        : process.env[key]
      console.log(`   ✅ ${key}: ${value}`)
    } else {
      console.log(`   ⚠️  ${key}: Not set (optional)`)
    }
  })
  
  // Validate specific formats
  console.log('\n🔍 Validating formats:')
  
  // Check DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.startsWith('postgresql://')) {
      console.log('   ✅ DATABASE_URL: Valid PostgreSQL format')
    } else {
      console.log('   ❌ DATABASE_URL: Must start with postgresql://')
      hasErrors = true
    }
  }
  
  // Check Stripe keys
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.log('   ❌ STRIPE_SECRET_KEY: Must start with sk_')
    hasErrors = true
  } else if (process.env.STRIPE_SECRET_KEY) {
    console.log('   ✅ STRIPE_SECRET_KEY: Valid format')
  }
  
  if (process.env.STRIPE_PUBLISHABLE_KEY && !process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.log('   ❌ STRIPE_PUBLISHABLE_KEY: Must start with pk_')
    hasErrors = true
  } else if (process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('   ✅ STRIPE_PUBLISHABLE_KEY: Valid format')
  }
  
  // Check NEXTAUTH_SECRET length
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.log('   ⚠️  NEXTAUTH_SECRET: Should be at least 32 characters for security')
  } else if (process.env.NEXTAUTH_SECRET) {
    console.log('   ✅ NEXTAUTH_SECRET: Valid length')
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (hasErrors) {
    console.log('❌ Environment validation failed!')
    console.log('\n🔧 Fix the issues above and try again.')
    process.exit(1)
  } else {
    console.log('✅ Environment validation passed!')
    console.log('\n🎯 Ready to run: pnpm setup')
  }
}

validateEnvironment()
