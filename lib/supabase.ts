import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.')
}

// Client for client-side operations (browser) - uses publishable key
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Admin client for server-side operations (bypasses RLS) - uses secret key
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Storage configuration
export const STORAGE_BUCKETS = {
  PROPERTY_PHOTOS: 'property-photos',
  DOCUMENTS: 'documents'
} as const

// Helper function to upload file to Supabase storage (server-side)
export async function uploadFileToStorage(
  bucket: string,
  filePath: string,
  file: File
): Promise<{ data: unknown; error: unknown }> {
  // Use admin client for server-side operations (bypasses RLS)
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true // This allows overwriting if file exists
    })
  
  return { data, error }
}

// Helper function to get public URL for file
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

// Helper function to delete file from storage (server-side)
export async function deleteFileFromStorage(
  bucket: string,
  filePath: string
): Promise<{ data: unknown; error: unknown }> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath])
  
  return { data, error }
}
