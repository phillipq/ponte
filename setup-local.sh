#!/bin/bash

# Setup script for local development with PostgreSQL on worker.local

echo "Setting up Property Mapping App for local development..."

# Create .env.local file
cat > .env.local << 'EOF'
# App Configuration
APP_ID="app-ponte"
APP_NAME="Property Mapping App"
APP_DOMAIN="localhost:3012"

# Admin Configuration
ADMIN_EMAIL="admin@localhost.com"
MASTER_ADMIN_EMAIL="admin@localhost.com"
IS_MASTER_ADMIN="false"
MASTER_ADMIN_URL="http://localhost:3000"

# Database (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@worker.local:5432/app_ponte"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
NEXTAUTH_URL="http://localhost:3012"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe (optional for now)
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Google Maps API (for geocoding and distance matrix)
# Get your API key from: https://console.cloud.google.com/apis/credentials
GOOGLE_MAPS_API_KEY=""
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Bundle Analyzer
ANALYZE="false"
EOF

echo "Created .env.local file"
echo ""
echo "Next steps:"
echo "1. Update the DATABASE_URL with your actual PostgreSQL password"
echo "2. Set up your Google Maps API key for geocoding and distance matrix"
echo "3. Run: pnpm install"
echo "4. Run: pnpm db:push"
echo "5. Run: pnpm dev"
