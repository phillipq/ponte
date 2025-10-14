# Ponte Property Management - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `phillipq/ponte`
4. Vercel will automatically detect it's a Next.js project

### 2. Configure Environment Variables
In your Vercel project settings, add these environment variables:

#### Required Variables:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1&connect_timeout=10
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-project.vercel.app
```

#### Supabase Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

#### Google Maps (Required for distance calculations):
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Optional Variables:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
```

### 3. Database Setup
1. **Supabase Setup**: Follow the guides in your project:
   - `SUPABASE-STORAGE-SETUP.md`
   - `MODERN-SUPABASE-SETUP.md`
   - `CREATE-BUCKETS-GUIDE.md`

2. **Database Migration**: Run Prisma migrations:
   ```bash
   npx prisma db push
   ```

### 4. Storage Buckets Setup
Create these buckets in Supabase Storage:
- `property-photos` (MIME: `image/*`)
- `documents` (MIME: `application/*, text/*`)

### 5. RLS Policies Setup
Follow `SUPABASE-RLS-POLICIES.md` to set up Row Level Security policies.

## 🔧 Build Configuration

### Vercel Build Settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### Package.json Scripts:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

## 📁 Important Files for Deployment

### Environment Files:
- `vercel-env.example` - Template for environment variables
- `.env.local` - Local development (don't commit)

### Database Files:
- `prisma/schema.prisma` - Database schema
- `lib/prisma.ts` - Database connection

### Supabase Files:
- `lib/supabase.ts` - Supabase configuration
- `SUPABASE-STORAGE-SETUP.md` - Storage setup guide

## 🚨 Common Deployment Issues

### 1. Database Connection Issues
- Ensure `DATABASE_URL` includes `?pgbouncer=true&connection_limit=1&connect_timeout=10`
- Check Supabase project is active
- Verify database credentials

### 2. Supabase Storage Issues
- Create required buckets: `property-photos` and `documents`
- Set proper MIME types for buckets
- Configure RLS policies correctly

### 3. Google Maps API Issues
- Ensure API key has proper permissions
- Enable Distance Matrix API
- Check API quotas and billing

### 4. NextAuth Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure OAuth providers are configured

## 🔍 Post-Deployment Checklist

### ✅ Functionality Tests:
- [ ] User authentication works
- [ ] Property creation and editing
- [ ] File uploads (images and documents)
- [ ] Distance calculations
- [ ] Property evaluations
- [ ] Tour planning

### ✅ Performance Checks:
- [ ] Page load times are acceptable
- [ ] Images load properly
- [ ] Database queries are optimized
- [ ] API responses are fast

### ✅ Security Checks:
- [ ] Environment variables are secure
- [ ] Database access is properly restricted
- [ ] File uploads are validated
- [ ] User sessions are secure

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set

## 🎯 Next Steps After Deployment

1. **Test all features** on the live site
2. **Set up monitoring** (optional)
3. **Configure custom domain** (optional)
4. **Set up backups** for Supabase
5. **Monitor performance** and optimize as needed

---

**Repository**: https://github.com/phillipq/ponte
**Vercel Dashboard**: https://vercel.com/dashboard
