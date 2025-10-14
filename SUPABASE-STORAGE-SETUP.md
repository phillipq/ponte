# Supabase Storage Setup Guide

This guide will help you set up Supabase storage for file uploads in your Ponte Property Management application.

## Prerequisites

- Supabase project created
- Environment variables configured

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Storage Buckets Setup

### 1. Create Storage Buckets

In your Supabase dashboard, go to **Storage** and create the following buckets:

#### Property Photos Bucket
- **Name**: `property-photos`
- **Public**: Yes (so images can be accessed directly)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/*`

#### Documents Bucket
- **Name**: `documents`
- **Public**: Yes (so documents can be accessed directly)
- **File size limit**: 10MB
- **Allowed MIME types**: `*/*` (all file types)

### 2. Set Up Row Level Security (RLS)

For each bucket, you'll need to set up RLS policies. Here are the SQL commands to run in your Supabase SQL editor:

#### Property Photos Bucket RLS
```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for property photos - users can upload/delete their own files
CREATE POLICY "Users can upload property photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete property photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Property photos are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'property-photos');
```

#### Documents Bucket RLS
```sql
-- Policy for documents - users can upload/delete their own files
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

### 3. Test the Setup

1. Start your development server: `pnpm dev`
2. Go to a property page
3. Try uploading an image file - it should go to the `property-photos` bucket
4. Try uploading a document file (PDF, Excel, etc.) - it should go to the `documents` bucket

## File Structure in Storage

Files will be organized as follows:

```
property-photos/
├── properties/
│   ├── {property-id}/
│   │   ├── 1703123456789_abc123.jpg
│   │   └── 1703123456790_def456.png
│   └── {another-property-id}/
│       └── 1703123456791_ghi789.jpg

documents/
├── properties/
│   ├── {property-id}/
│   │   ├── 1703123456789_abc123.pdf
│   │   └── 1703123456790_def456.xlsx
│   └── {another-property-id}/
│       └── 1703123456791_ghi789.doc
```

## Benefits of Supabase Storage

- **Scalable**: No file size limits on your server
- **CDN**: Files are served from a global CDN
- **Security**: Built-in authentication and authorization
- **Backup**: Automatic backups and redundancy
- **Performance**: Fast file serving worldwide
- **Cost-effective**: Pay only for what you use

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check RLS policies are set up correctly
2. **File not found**: Verify the file path and bucket name
3. **Upload fails**: Check file size limits and MIME type restrictions

### Debug Steps

1. Check Supabase logs in the dashboard
2. Verify environment variables are set correctly
3. Test with a simple file upload first
4. Check browser network tab for error details

## Migration from Local Storage

If you have existing files in local storage, you'll need to:

1. Download existing files from your local `public/uploads` directory
2. Upload them to the appropriate Supabase storage buckets
3. Update the database URLs to point to Supabase storage URLs
4. Remove the local files

This can be done with a migration script if needed.
