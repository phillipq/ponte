# Fix Supabase Authentication for File Uploads

## The Problem
When you set RLS policies to `authenticated`, uploads fail because the server-side API doesn't have a valid Supabase session.

## Root Cause
Your file upload API (`/api/properties/[id]/files/route.ts`) is using the Supabase client without authentication. The client needs to be authenticated to work with `authenticated` RLS policies.

## Solution Options

### Option 1: Use Service Role Key (Recommended for Server-Side)

This is the most secure approach for server-side operations:

1. **Get your Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the "service_role" key (not the anon key)

2. **Add to your `.env.local`:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Update your Supabase client in the API:**
   ```typescript
   // In lib/supabase.ts - add a server-side client
   export const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     }
   )
   ```

4. **Update your file upload API to use the admin client:**
   ```typescript
   import { supabaseAdmin } from "lib/supabase"
   
   // Use supabaseAdmin instead of supabase for server-side operations
   ```

### Option 2: Use User Authentication (More Complex)

If you want to use user authentication:

1. **Pass the user's session to the API**
2. **Create an authenticated Supabase client with the user's token**
3. **Use that client for uploads**

### Option 3: Hybrid Approach (Best of Both)

Use service role for uploads but maintain user context:

1. **Use service role for file operations** (bypasses RLS)
2. **Add user-specific file paths** (e.g., `users/{userId}/properties/{propertyId}/`)
3. **Implement your own authorization** in the API route

## Recommended Implementation

### Step 1: Add Service Role Key

Add to your `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 2: Update Supabase Client

Update `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

// Client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Step 3: Update File Upload API

Update `app/api/properties/[id]/files/route.ts`:
```typescript
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl, deleteFileFromStorage } from "lib/supabase"

// Use supabaseAdmin instead of supabase for all operations
```

### Step 4: Update RLS Policies

Now you can set your RLS policies to `authenticated` because the API will use the service role:

1. **Go to Supabase Dashboard → Storage**
2. **Set policies to `authenticated`**
3. **Policy definitions can be `true`** (service role bypasses RLS)

## Security Benefits

- ✅ **Service role bypasses RLS** - no authentication issues
- ✅ **Your API still validates user ownership** - security maintained
- ✅ **Files are organized by user/property** - proper isolation
- ✅ **Server-side operations** - more secure than client-side

## Test the Fix

After implementing:

1. **Set RLS policies to `authenticated`**
2. **Test uploads** - should work perfectly
3. **Verify security** - only your API can upload files

This approach gives you the security of authenticated policies while avoiding the authentication complexity! 🚀
