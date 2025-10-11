# Vercel Deployment Guide for Ponte Property Management

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Database**: Set up your database (already configured)
4. **API Keys**: Gather all required API keys

## Step 1: Push to GitHub

```bash
# Add your GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/ponte-property-management.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. **Import Project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

## Step 3: Environment Variables

Add these environment variables in your Vercel project settings:

### Required Variables
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
```

### Optional Variables
```
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_GEOCODING_API_KEY=your-google-maps-geocoding-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App Configuration
APP_ID=ponte-property-management
APP_NAME=Ponte Property Management
ADMIN_EMAIL=admin@yourdomain.com
```

## Step 4: Database Setup

1. **Run Prisma Migrations**:
   ```bash
   # In Vercel, add this as a build command or run manually
   npx prisma db push
   ```

2. **Seed Database** (optional):
   ```bash
   npx prisma db seed
   ```

## Step 5: Domain Configuration

1. **Custom Domain** (optional):
   - Add your custom domain in Vercel project settings
   - Update `NEXTAUTH_URL` to match your domain

2. **SSL Certificate**: Automatically handled by Vercel

## Step 6: Post-Deployment

1. **Test the Application**:
   - Visit your Vercel URL
   - Test user registration/login
   - Test property submission
   - Test questionnaire functionality

2. **Admin Setup**:
   - Create an admin user via the database or API
   - Configure admin settings

## Troubleshooting

### Common Issues

1. **Database Connection**:
   - Verify `DATABASE_URL` is correct
   - Check Supabase connection settings
   - Ensure database is accessible from Vercel

2. **Build Failures**:
   - Check environment variables
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

3. **Authentication Issues**:
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure OAuth providers are configured

### Useful Commands

```bash
# Check build locally
npm run build

# Test production build
npm start

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to Git
2. **Database**: Use connection pooling for production
3. **API Keys**: Rotate keys regularly
4. **HTTPS**: Always use HTTPS in production

## Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Error Tracking**: Consider adding Sentry
3. **Performance**: Monitor Core Web Vitals
4. **Database**: Monitor Supabase usage and performance

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
