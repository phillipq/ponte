-- Check RLS policies and data for destinations table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'Destination';

-- 2. Check RLS policies on destinations table
SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination';

-- 3. Check if there are any destinations in the database
SELECT COUNT(*) as destination_count FROM "Destination";

-- 4. Check destinations with user info
SELECT 
  d.id,
  d.name,
  d.category,
  d."userId",
  u.email as user_email
FROM "Destination" d
LEFT JOIN "User" u ON d."userId" = u.id
LIMIT 10;

-- 5. Check current user context (if running as authenticated user)
SELECT auth.uid() as current_user_id;
