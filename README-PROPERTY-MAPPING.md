# Property Mapping App

A Next.js application for analyzing property locations and their proximity to custom destination lists using Google Maps APIs.

## 🎯 Overview

This application allows users to:
- Add properties with custom tags
- Create custom destination lists (beaches, museums, restaurants, etc.)
- Calculate driving distances and times from properties to destinations
- Analyze and compare properties based on proximity to different destination types

## 🏗️ Architecture

### Core Features
- **Property Management**: Add properties with addresses, names, and custom tags
- **Destination Lists**: Create custom lists of destinations (beaches, museums, etc.)
- **Geocoding**: Convert addresses to latitude/longitude coordinates
- **Distance Matrix**: Calculate driving distances and times between properties and destinations
- **Analysis Dashboard**: Compare properties based on proximity to different destination types

### Tech Stack
- **Frontend**: Next.js 15 (App Directory), Tailwind CSS v4
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: Google Maps Geocoding API, Distance Matrix API
- **Authentication**: NextAuth.js (Credentials + Google OAuth)

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Run the setup script
./setup-local.sh

# Update .env.local with your actual values:
# - DATABASE_URL: Your PostgreSQL connection string
# - GOOGLE_MAPS_API_KEY: Your Google Maps API key
# - NEXTAUTH_SECRET: A secure random string
```

### 2. Database Setup

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Generate Prisma client
pnpm db:generate
```

### 3. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` - you'll be redirected to the login page.

## 🔧 Configuration

### Required Environment Variables

```bash
# App Configuration
APP_ID="app-ponte"
APP_NAME="Property Mapping App"
APP_DOMAIN="localhost:3000"

# Database (Local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@worker.local:5432/app_ponte"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps API (Required)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Geocoding API
   - Distance Matrix API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

## 📊 Database Schema

### Core Models

#### Property
- Stores user properties with addresses and coordinates
- Supports custom tags for categorization
- Links to distance calculations

#### DestinationList
- Custom lists of destinations (beaches, museums, etc.)
- User-specific and customizable

#### Destination
- Individual destinations within lists
- Stores address, coordinates, and optional Google Places data

#### PropertyDistance
- Cached distance calculations between properties and destinations
- Prevents redundant API calls
- Stores driving distance, duration, and traffic-adjusted times

## 🔐 Authentication

The app uses NextAuth.js with:
- **Credentials Provider**: Email/password authentication
- **Google OAuth**: Optional Google sign-in
- **Session Management**: JWT-based sessions
- **Password Security**: bcrypt hashing

## 🗺️ API Endpoints

### Properties
- `GET /api/properties` - List user's properties
- `POST /api/properties` - Create new property

### Destination Lists
- `GET /api/destination-lists` - List user's destination lists
- `POST /api/destination-lists` - Create new destination list

### Destinations
- `GET /api/destinations?listId=...` - List destinations in a list
- `POST /api/destinations` - Add destination to list

### Geocoding
- `POST /api/geocoding` - Convert address to coordinates

### Distance Matrix
- `POST /api/distance-matrix` - Calculate distances between property and destinations

## 🎨 User Interface

### Dashboard (`/dashboard`)
- Overview of properties and destination lists
- Quick actions for adding new items
- Navigation to analysis tools

### Property Management (`/properties/new`)
- Add properties with address geocoding
- Custom tags and naming
- Real-time geocoding validation

### Destination Lists (`/destinations/new`, `/destinations/[id]`)
- Create custom destination lists
- Add destinations with geocoding
- Manage multiple destinations per list

### Analysis (`/analysis`)
- Select property and destination lists
- Calculate distances and driving times
- View results in organized tables
- Compare properties based on proximity

## 🔄 Workflow

1. **Add Properties**: Users enter property addresses, which are geocoded to get coordinates
2. **Create Destination Lists**: Users create custom lists (beaches, museums, etc.)
3. **Add Destinations**: Users add destinations to lists, either manually or via Google Places
4. **Calculate Distances**: The app calculates driving distances and times using Google Distance Matrix API
5. **Cache Results**: Distances are stored in the database to avoid redundant API calls
6. **Analyze Properties**: Users can compare properties based on proximity to different destination types

## 🚀 Deployment

### Local PostgreSQL Setup

1. Install PostgreSQL on your `worker.local` server
2. Create database: `CREATE DATABASE app_ponte;`
3. Update `DATABASE_URL` in `.env.local`
4. Run `pnpm db:push` to create tables

### Production Deployment

1. Set up PostgreSQL database (Supabase, AWS RDS, etc.)
2. Configure environment variables
3. Deploy to Vercel, Netlify, or your preferred platform
4. Set up Google Maps API key with domain restrictions

## 🔒 Security Considerations

- **API Key Security**: Restrict Google Maps API key to your domain
- **Database Security**: Use strong passwords and network restrictions
- **Authentication**: Secure session management with NextAuth.js
- **Input Validation**: All API inputs are validated with Zod schemas

## 📈 Performance Optimizations

- **Distance Caching**: Avoid redundant API calls by storing results
- **Batch Processing**: Calculate multiple distances in single API call
- **Database Indexing**: Optimized queries for property and destination lookups
- **Lazy Loading**: Components load data only when needed

## 🛠️ Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio
pnpm validate         # Validate environment variables
```

### Database Management

```bash
# Reset database
pnpm db:push --force-reset

# View database
pnpm db:studio

# Generate new migration
pnpm db:migrate
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Verify `DATABASE_URL` format and credentials
2. **Google Maps API**: Check API key and enabled services
3. **Geocoding Failures**: Verify address format and API quotas
4. **Distance Calculations**: Check API key permissions and quotas

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and logging.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Maps APIs Documentation](https://developers.google.com/maps/documentation)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**This application provides a complete solution for property analysis based on proximity to custom destination lists, with efficient caching and user-friendly interfaces.**
