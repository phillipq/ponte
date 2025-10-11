#!/bin/bash

# App Template Setup Script
# This script helps you quickly set up a new instance of your AI app template

set -e

echo "🚀 Setting up your AI App Template..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.template .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please edit .env.local with your actual values before continuing"
    echo "   Required: DATABASE_URL, NEXTAUTH_SECRET, STRIPE keys"
    read -p "Press Enter when you've updated .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
pnpm db:generate

# Setup database (handles Supabase connection issues)
echo "🗄️  Setting up database..."
node scripts/setup-database.js

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start development server: pnpm dev"
echo "2. Test registration: http://localhost:3000/auth/signup"
echo "3. Test login: http://localhost:3000/auth/signin"
echo "4. Check dashboard: http://localhost:3000/dashboard"
echo ""
echo "📚 For detailed setup instructions, see SETUP-GUIDE.md"

