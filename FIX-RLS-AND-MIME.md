# Fix RLS Policies and MIME Type Restrictions

## Issues Found
1. **RLS policies are blocking uploads** - "new row violates row-level security policy"
2. **MIME type restrictions** - Documents bucket doesn't allow PDF files

## Fix 1: RLS Policies

### Go to Supabase Dashboard → Storage

#### For `property-photos` bucket:
1. **Click on `property-photos` bucket**
2. **Go to "Policies" tab**
3. **Delete all existing policies** (if any)
4. **Create these 3 new policies:**

**Policy 1: Allow Uploads**
- **Name**: `Allow all uploads`
- **Command**: `INSERT`
- **Applied to**: `public`
- **Policy definition**: `true`

**Policy 2: Allow Reads**
- **Name**: `Allow all reads`
- **Command**: `SELECT`
- **Applied to**: `public`
- **Policy definition**: `true`

**Policy 3: Allow Deletes**
- **Name**: `Allow all deletes`
- **Command**: `DELETE`
- **Applied to**: `public`
- **Policy definition**: `true`

#### For `documents` bucket:
1. **Click on `documents` bucket**
2. **Go to "Policies" tab**
3. **Delete all existing policies** (if any)
4. **Create the same 3 policies** as above

## Fix 2: MIME Type Restrictions

### Go to Supabase Dashboard → Storage

#### For `property-photos` bucket:
1. **Click on `property-photos` bucket**
2. **Go to "Settings" tab**
3. **Check "Allowed MIME types"**
4. **Set to**: `image/*` or `*/*` (for all types)

#### For `documents` bucket:
1. **Click on `documents` bucket**
2. **Go to "Settings" tab**
3. **Check "Allowed MIME types"**
4. **Set to**: `*/*` (for all file types)

## Fix 3: Bucket Settings

### Verify these settings for both buckets:

1. **Public bucket**: ✅ **Yes** (very important!)
2. **File size limit**: `10MB` or higher
3. **Allowed MIME types**: Appropriate for the bucket
4. **RLS enabled**: ✅ **Yes** (but with permissive policies)

## Test the Fix

After making these changes:

1. **Wait 30 seconds** for changes to propagate
2. **Run the test**: `node test-image-upload.js`
3. **You should see**: ✅ Upload successful!

## If Still Not Working

### Nuclear Option - Disable RLS Temporarily:

1. **Go to Storage → Settings**
2. **Find "Row Level Security"**
3. **Temporarily disable it**
4. **Test uploads**
5. **Re-enable RLS** once uploads work
6. **Add proper policies**

### Alternative - Check Authentication:

The issue might be that your app's authentication isn't working with Supabase. Check:

1. **Are you logged in** in your app?
2. **Is the session valid** when making upload requests?
3. **Are authentication headers** being sent?

## Expected Results

After fixing RLS and MIME types:

```
✅ Upload successful!
   File path: properties/test-property-id/test-image.png
   Public URL: https://your-project.supabase.co/storage/v1/object/public/property-photos/properties/test-property-id/test-image.png
```

## Security Note

The `public` policies with `true` are for testing. Once uploads work:

1. **Change to `authenticated`** instead of `public`
2. **Add user-specific conditions**
3. **Restrict by file path**

But first, let's get uploads working! 🚀
