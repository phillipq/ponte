# Debug RLS Policies - Step by Step

## Current Issue
You're still getting `new row violates row-level security policy` even after creating policies. Let's debug this systematically.

## Step 1: Verify Policy Configuration

### Check Each Policy in Supabase Dashboard:

#### For `property-photos` bucket:
1. **Go to Storage → property-photos → Policies**
2. **Verify you have exactly these 3 policies:**

**Policy 1: INSERT**
- Name: `Allow authenticated uploads`
- Command: `INSERT`
- Applied to: `authenticated`
- Policy definition: `true`

**Policy 2: DELETE**
- Name: `Allow authenticated deletes`
- Command: `DELETE`
- Applied to: `authenticated`
- Policy definition: `true`

**Policy 3: SELECT**
- Name: `Allow public read`
- Command: `SELECT`
- Applied to: `public`
- Policy definition: `true`

#### For `documents` bucket:
1. **Go to Storage → documents → Policies**
2. **Create the same 3 policies as above**

## Step 2: Check Bucket Settings

### Verify Bucket Configuration:
1. **Go to Storage → property-photos → Settings**
2. **Check these settings:**
   - **Public bucket**: Should be `Yes`
   - **File size limit**: Should be at least 10MB
   - **Allowed MIME types**: Should include `image/*` or `*/*`

3. **Repeat for documents bucket**

## Step 3: Test with Simplified Policies

If the above doesn't work, try these even more permissive policies:

### Temporary Debug Policies (Less Secure but Will Work):

**For INSERT operations:**
- Name: `Debug INSERT`
- Command: `INSERT`
- Applied to: `public` (not authenticated)
- Policy definition: `true`

**For SELECT operations:**
- Name: `Debug SELECT`
- Command: `SELECT`
- Applied to: `public`
- Policy definition: `true`

**For DELETE operations:**
- Name: `Debug DELETE`
- Command: `DELETE`
- Applied to: `public`
- Policy definition: `true`

## Step 4: Check Authentication

The error might be related to authentication. Let's verify:

1. **Check if you're properly authenticated** in your app
2. **Verify the session is valid** when making the upload request
3. **Check browser network tab** to see if authentication headers are being sent

## Step 5: Alternative Approach - Disable RLS Temporarily

If nothing else works, you can temporarily disable RLS to test:

1. **Go to Storage → Settings**
2. **Find "Row Level Security"**
3. **Temporarily disable it** for testing
4. **Test upload**
5. **Re-enable RLS** once uploads work
6. **Then add proper policies**

## Step 6: Check File Path Structure

The error might be related to the file path. Let's verify the path structure:

- **Expected path**: `properties/{property-id}/{filename}`
- **Your path**: `properties/cmgqlmdhv00011twv4gg3j37n/1760449475710_q50b00o95yr.png`

This looks correct, so the issue is likely with the policies.

## Step 7: Verify Policy Syntax

Make sure your policies are exactly like this:

### For INSERT Policy:
```sql
true
```

### For SELECT Policy:
```sql
true
```

### For DELETE Policy:
```sql
true
```

**Important**: Don't add any conditions, just `true`.

## Step 8: Test Upload Again

After making these changes:

1. **Save all policies**
2. **Wait 30 seconds** for policies to propagate
3. **Restart your dev server**: `pnpm dev`
4. **Try uploading again**

## If Still Not Working

Try this nuclear option - create a policy that allows everything:

**Name**: `Allow everything`
**Command**: `ALL`
**Applied to**: `public`
**Policy definition**: `true`

This is not secure for production but will definitely work for testing.

## Next Steps

Once uploads work with the permissive policies, we can tighten security by:

1. **Adding user-specific policies**
2. **Restricting by file path**
3. **Adding proper authentication checks**

But first, let's get uploads working with the simple policies.
