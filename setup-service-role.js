#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 Setting up Modern Supabase API Keys for Secure File Uploads...\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found. Please run the basic setup first.');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if modern keys already exist
if (envContent.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') && envContent.includes('SUPABASE_SECRET_KEY')) {
  console.log('✅ Modern Supabase API keys already exist in .env.local');
  console.log('💡 If uploads are still failing, check that the keys are correct.');
} else {
  console.log('📝 Adding modern Supabase API keys to .env.local...\n');
  
  // Add modern API keys to .env.local
  const modernKeys = `# Modern Supabase API Keys (recommended)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_publishable_key_here"
SUPABASE_SECRET_KEY="your_secret_key_here"

`;
  
  // Replace legacy keys if they exist, otherwise add new ones
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY="[^"]*"/,
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_publishable_key_here"'
    );
  }
  
  if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY="[^"]*"/,
      'SUPABASE_SECRET_KEY="your_secret_key_here"'
    );
  }
  
  // Add the modern keys if they don't exist
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) {
    envContent += `\n${modernKeys}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added modern Supabase API keys to .env.local');
}

console.log('\n📋 Next Steps:');
console.log('=====================================');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Go to Settings → API');
console.log('3. Copy the "publishable" key (for client-side)');
console.log('4. Copy the "secret" key (for server-side)');
console.log('5. Replace the placeholder keys in .env.local');
console.log('6. Set your RLS policies to "authenticated"');
console.log('7. Test uploads - they should work securely!');
console.log('\n🔒 Modern Security Benefits:');
console.log('- Uses latest Supabase authentication model');
console.log('- Publishable key for client-side (with RLS)');
console.log('- Secret key for server-side (bypasses RLS)');
console.log('- Future-proof authentication approach');
console.log('\n✨ After setup, your file uploads will be both secure and modern!');
