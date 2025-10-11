#!/usr/bin/env node

// Database setup script that handles Supabase connection issues
require('dotenv').config({ path: '.env.local' })
const { execSync } = require('child_process')

function urlEncodePassword(url) {
  // Extract password from URL and encode special characters
  const urlMatch = url.match(/^(postgresql:\/\/[^:]+:)([^@]+)(@.*)$/)
  if (!urlMatch) return url
  
  const [, prefix, password, suffix] = urlMatch
  const encodedPassword = encodeURIComponent(password)
  
  return `${prefix}${encodedPassword}${suffix}`
}

function setupDatabase() {
  console.log('🗄️  Setting up database...')
  
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env.local')
      console.log('📝 Please add your Supabase connection string to .env.local')
      process.exit(1)
    }
    
    // Encode the password in the URL
    const encodedUrl = urlEncodePassword(process.env.DATABASE_URL)
    
    console.log('🔧 Encoding database URL for special characters...')
    
    // Set the encoded URL as environment variable
    process.env.DATABASE_URL = encodedUrl
    
    console.log('📊 Pushing database schema...')
    execSync('pnpm db:push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: encodedUrl }
    })
    
    console.log('🌱 Seeding database...')
    execSync('pnpm db:seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: encodedUrl }
    })
    
    console.log('✅ Database setup complete!')
    console.log('🎯 You can now run: pnpm dev')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Check your DATABASE_URL in .env.local')
    console.log('2. Verify your Supabase project is active')
    console.log('3. Ensure your database password is correct')
    process.exit(1)
  }
}

setupDatabase()
