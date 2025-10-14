# Modern Supabase API Keys Setup

## Overview
Supabase has updated their authentication model. The legacy `anon` and `service_role` keys are being phased out in favor of the modern API key system.

## Modern API Keys

### **Publishable Key** (Client-side)
- **Used for**: Browser/client-side operations
- **Respects RLS**: Yes, follows Row Level Security policies
- **Environment variable**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Usage**: Client-side Supabase operations

### **Secret Key** (Server-side)
- **Used for**: Server-side operations
- **Bypasses RLS**: Yes, has admin privileges
- **Environment variable**: `SUPABASE_SECRET_KEY`
- **Usage**: Server-side API operations

## Setup Steps

### 1. Get Your Modern API Keys

1. **Go to Supabase Dashboard → Settings → API**
2. **Look for the modern API keys section** (not the legacy section)
3. **Copy the "publishable" key** (for client-side)
4. **Copy the "secret" key** (for server-side)

### 2. Update Your Environment Variables

Add to your `.env.local`:
```env
# Modern Supabase API Keys (recommended)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_publishable_key_here"
SUPABASE_SECRET_KEY="your_secret_key_here"
```

### 3. Update Your Code

The code has been updated to use:
- **`supabase`** client: Uses publishable key (client-side, respects RLS)
- **`supabaseAdmin`** client: Uses secret key (server-side, bypasses RLS)

### 4. Set RLS Policies to Authenticated

Now you can safely set your RLS policies to `authenticated`:

1. **Go to Storage → property-photos → Policies**
2. **Set all policies to `authenticated`**
3. **Policy definitions can be `true`**
4. **Repeat for documents bucket**

## Benefits of Modern Approach

### ✅ **Future-Proof**
- Uses the latest Supabase authentication model
- No deprecation warnings
- Long-term support guaranteed

### ✅ **Better Security**
- Clear separation between client and server operations
- Publishable key is safe for client-side use
- Secret key is properly protected server-side

### ✅ **RLS Compatibility**
- Client operations respect RLS policies
- Server operations can bypass RLS when needed
- Proper authentication flow

### ✅ **Performance**
- Optimized for modern Supabase infrastructure
- Better caching and connection handling
- Improved reliability

## Migration from Legacy Keys

If you're currently using legacy keys:

1. **Run the setup script**: `node setup-service-role.js`
2. **Replace legacy keys** with modern ones
3. **Update your environment variables**
4. **Test the new setup**

## Testing the Modern Setup

After updating your keys:

1. **Restart your dev server**: `pnpm dev`
2. **Test file uploads** - should work with authenticated RLS policies
3. **Verify security** - only your API can upload files
4. **Check performance** - should be faster and more reliable

## Troubleshooting

### If uploads still fail:
1. **Check you're using the correct keys** (publishable vs secret)
2. **Verify RLS policies are set to `authenticated`**
3. **Check bucket settings** (public, MIME types)
4. **Restart your dev server** after changing environment variables

### If you get authentication errors:
1. **Verify the secret key** is correct for server-side operations
2. **Check the publishable key** is correct for client-side operations
3. **Ensure environment variables are loaded** properly

## Security Best Practices

1. **Never expose the secret key** in client-side code
2. **Use the publishable key** for client-side operations
3. **Use the secret key** only for server-side operations
4. **Keep your keys secure** and rotate them regularly
5. **Use environment variables** for all keys

The modern approach gives you the best of both worlds: secure RLS policies that actually work with proper authentication! 🚀
