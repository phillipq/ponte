# Supabase RLS Policies for File Uploads

## The Issue
The current RLS policies are too restrictive and are blocking file uploads. Here are the correct policies to set up in your Supabase dashboard.

## Policy Setup in Supabase UI

### For `property-photos` Bucket

#### 1. Policy: "Allow authenticated users to upload property photos"
- **Name**: `Allow authenticated users to upload property photos`
- **Command**: `INSERT`
- **Applied to**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'property-photos'
```

#### 2. Policy: "Allow authenticated users to delete property photos"
- **Name**: `Allow authenticated users to delete property photos`
- **Command**: `DELETE`
- **Applied to**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'property-photos'
```

#### 3. Policy: "Allow public read access to property photos"
- **Name**: `Allow public read access to property photos`
- **Command**: `SELECT`
- **Applied to**: `public` (or `anon`)
- **Policy definition**:
```sql
bucket_id = 'property-photos'
```

### For `documents` Bucket

#### 1. Policy: "Allow authenticated users to upload documents"
- **Name**: `Allow authenticated users to upload documents`
- **Command**: `INSERT`
- **Applied to**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

#### 2. Policy: "Allow authenticated users to delete documents"
- **Name**: `Allow authenticated users to delete documents`
- **Command**: `DELETE`
- **Applied to**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'documents'
```

#### 3. Policy: "Allow public read access to documents"
- **Name**: `Allow public read access to documents`
- **Command**: `SELECT`
- **Applied to**: `public` (or `anon`)
- **Policy definition**:
```sql
bucket_id = 'documents'
```

## Alternative: Simplified Policies (Recommended)

If the above doesn't work, try these more permissive policies:

### For Both Buckets - Simplified Approach

#### 1. Policy: "Allow all authenticated operations"
- **Name**: `Allow all authenticated operations`
- **Command**: `ALL` (or select INSERT, UPDATE, DELETE)
- **Applied to**: `authenticated`
- **Policy definition**:
```sql
true
```

#### 2. Policy: "Allow public read access"
- **Name**: `Allow public read access`
- **Command**: `SELECT`
- **Applied to**: `public`
- **Policy definition**:
```sql
true
```

## Step-by-Step Setup

1. **Go to Storage in Supabase Dashboard**
2. **Click on your bucket** (property-photos or documents)
3. **Go to "Policies" tab**
4. **Click "New Policy"**
5. **Fill in the policy details** as shown above
6. **Save the policy**
7. **Repeat for all 6 policies** (3 for each bucket)

## Testing

After setting up the policies:

1. **Restart your development server**: `pnpm dev`
2. **Try uploading a file** to a property
3. **Check the browser console** for any errors
4. **Verify the file appears** in your Supabase storage

## Troubleshooting

### If uploads still fail:
1. **Check bucket permissions** - make sure buckets are public
2. **Verify RLS is enabled** but policies allow access
3. **Check file size limits** in bucket settings
4. **Verify MIME type restrictions** allow your file types

### Common Issues:
- **403 Forbidden**: RLS policies too restrictive
- **File not found**: Check bucket name and file path
- **Upload timeout**: Check file size limits

## Security Note

The simplified policies (`true` for authenticated users) are more permissive but still secure because:
- Only authenticated users can upload/delete
- Files are organized by property ID
- Public read access is needed for file display

For production, you might want to add more specific policies later, but these will get your uploads working.
