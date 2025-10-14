# Create Supabase Storage Buckets - Complete Guide

## Issue Found
The test revealed that your storage buckets don't exist yet! You need to create them first.

## Step 1: Create Storage Buckets

### In Supabase Dashboard:

1. **Go to Storage** (left sidebar)
2. **Click "New bucket"**
3. **Create first bucket:**
   - **Name**: `property-photos`
   - **Public bucket**: ✅ **Yes** (important!)
   - **File size limit**: `10MB` (or higher)
   - **Allowed MIME types**: `image/*` (or `*/*` for all types)
4. **Click "Create bucket"**

5. **Create second bucket:**
   - **Name**: `documents`
   - **Public bucket**: ✅ **Yes** (important!)
   - **File size limit**: `10MB` (or higher)
   - **Allowed MIME types**: `*/*` (all file types)
6. **Click "Create bucket"**

## Step 2: Set Up RLS Policies

### For `property-photos` bucket:

1. **Click on the bucket** → **Policies tab**
2. **Create 3 policies:**

**Policy 1:**
- **Name**: `Allow uploads`
- **Command**: `INSERT`
- **Applied to**: `public`
- **Policy definition**: `true`

**Policy 2:**
- **Name**: `Allow reads`
- **Command**: `SELECT`
- **Applied to**: `public`
- **Policy definition**: `true`

**Policy 3:**
- **Name**: `Allow deletes`
- **Command**: `DELETE`
- **Applied to**: `public`
- **Policy definition**: `true`

### For `documents` bucket:

1. **Click on the bucket** → **Policies tab**
2. **Create the same 3 policies** as above

## Step 3: Verify Bucket Settings

### Check each bucket has:
- ✅ **Public bucket**: Yes
- ✅ **File size limit**: 10MB or higher
- ✅ **MIME types**: Appropriate for the bucket type
- ✅ **RLS policies**: 3 policies each (INSERT, SELECT, DELETE)

## Step 4: Test the Setup

Run the test script again:
```bash
node test-supabase-upload.js
```

You should see:
- ✅ Buckets found: `property-photos`, `documents`
- ✅ Upload successful

## Step 5: Test in Your App

1. **Restart your dev server**: `pnpm dev`
2. **Go to a property page**
3. **Try uploading an image** - should work now!
4. **Try uploading a document** - should work now!

## Troubleshooting

### If buckets still don't appear:
1. **Refresh the Supabase dashboard**
2. **Check you're in the right project**
3. **Verify you have admin access**

### If uploads still fail:
1. **Check bucket is public**
2. **Verify RLS policies are set to `public`**
3. **Check file size limits**
4. **Verify MIME type restrictions**

### If you get permission errors:
1. **Make sure policies are applied to `public`**
2. **Check policy definitions are exactly `true`**
3. **Wait 30 seconds after creating policies**

## Security Note

The `public` policies are for testing. Once uploads work, you can:
1. **Change policies to `authenticated`**
2. **Add more specific conditions**
3. **Restrict by user ID or file path**

But first, let's get uploads working with the simple setup!
