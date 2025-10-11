#!/bin/bash

# Multi-App Testing Script
# This script tests the multi-app functionality

set -e

echo "🧪 Testing Multi-App Setup..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Please create it first."
    echo "   Copy env.template to .env.local and configure your values"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
pnpm db:generate

# Run database migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Seed the database
echo "🌱 Seeding database..."
pnpm db:seed

echo "✅ Setup complete!"
echo ""
echo "🎯 Testing Steps:"
echo "1. Start dev server: pnpm dev"
echo "2. Test App 1: http://localhost:3000"
echo "3. Test App 2: http://localhost:3001 (with different APP_ID)"
echo ""
echo "📚 For detailed testing instructions, see TESTING-GUIDE.md"
