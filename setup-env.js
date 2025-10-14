#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables for Supabase storage...\n');

const envPath = path.join(__dirname, '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Please add the following variables manually:\n');
} else {
  console.log('📝 Creating .env.local file...\n');
}

const envContent = `# Database
DATABASE_URL="your_supabase_database_url_here"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3012"

# Supabase Configuration (REQUIRED FOR FILE UPLOADS)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url_here"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Optional: Google OAuth (if using)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Optional: Stripe (if using)
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"

# Optional: Google Maps (if using)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Optional: OpenAI (if using)
OPENAI_API_KEY="your_openai_api_key"
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created!\n');
}

console.log('📋 REQUIRED SUPABASE VARIABLES:');
console.log('=====================================');
console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
console.log('\n📖 How to get these values:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Select your project');
console.log('3. Go to Settings > API');
console.log('4. Copy the "Project URL" and "anon public" key');
console.log('\n🔄 After adding the variables, restart your development server:');
console.log('pnpm dev');
console.log('\n✨ Then try uploading files again!');
