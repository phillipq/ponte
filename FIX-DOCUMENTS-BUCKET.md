# Fix Documents Bucket MIME Type Issue

## Current Status
✅ **property-photos bucket**: Working perfectly!
❌ **documents bucket**: Still blocking all file types despite setting to `*/*`

## Step-by-Step Fix

### Option 1: Recreate the Documents Bucket

Sometimes Supabase caches the MIME type settings. Try recreating the bucket:

1. **Go to Supabase Dashboard → Storage**
2. **Delete the `documents` bucket** (if it's empty)
3. **Create a new `documents` bucket:**
   - **Name**: `documents`
   - **Public bucket**: ✅ **Yes**
   - **File size limit**: `10MB` or higher
   - **Allowed MIME types**: `*/*` (all types)
4. **Save the bucket**
5. **Add the same 3 RLS policies** as the property-photos bucket

### Option 2: Fix Existing Bucket Settings

If you want to keep the existing bucket:

1. **Go to Supabase Dashboard → Storage → documents bucket**
2. **Click "Settings" tab**
3. **Find "Allowed MIME types"**
4. **Clear the field completely** (delete everything)
5. **Type `*/*`** (exactly like this)
6. **Save settings**
7. **Wait 30 seconds**
8. **Test again**

### Option 3: Set Specific MIME Types

If `*/*` still doesn't work, try setting specific types:

1. **Go to bucket Settings**
2. **Set "Allowed MIME types" to:**
```
application/pdf,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/json,image/*
```

### Option 4: Disable MIME Type Checking

1. **Go to bucket Settings**
2. **Leave "Allowed MIME types" completely empty**
3. **Save settings**
4. **Test uploads**

## Test the Fix

After making changes:

```bash
node test-documents-fix.js
```

You should see:
- ✅ All file types upload successfully
- ✅ Files are cleaned up properly

## Alternative: Use Property-Photos for Everything

If the documents bucket continues to have issues, you can temporarily use the property-photos bucket for all files:

1. **Update your app** to use `property-photos` for both images and documents
2. **Set property-photos MIME types** to `*/*`
3. **Test uploads** - should work for everything

## Expected Results

After fixing the documents bucket:

```
✅ test.txt: Upload successful!
✅ test.csv: Upload successful!
✅ test.json: Upload successful!
✅ test.xlsx: Upload successful!
✅ test.pdf: Upload successful!
✅ test.doc: Upload successful!
```

## If Nothing Works

Try the nuclear option:

1. **Delete both buckets**
2. **Recreate them with identical settings**
3. **Set both to `*/*` MIME types**
4. **Add identical RLS policies**
5. **Test both buckets**

The property-photos bucket is working perfectly, so we know the setup is correct. The documents bucket just needs the same configuration! 🚀
