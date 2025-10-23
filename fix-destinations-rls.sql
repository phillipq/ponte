-- Fix RLS policies for destinations table
-- This script ensures destinations can be read by all authenticated users

-- 1. Check current RLS status and policies
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'Destination';

SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination';

-- 2. Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "destination_access" ON "Destination";
DROP POLICY IF EXISTS "destination_modify_own" ON "Destination";
DROP POLICY IF EXISTS "authenticated_full_access" ON "Destination";

-- 3. Create a simple, permissive policy for destinations
-- Allow all authenticated users to read all destinations
CREATE POLICY "destinations_read_all" ON "Destination"
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create destinations
CREATE POLICY "destinations_create" ON "Destination"
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update their own destinations
CREATE POLICY "destinations_update_own" ON "Destination"
  FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");

-- Allow users to delete their own destinations
CREATE POLICY "destinations_delete_own" ON "Destination"
  FOR DELETE TO authenticated USING (auth.uid()::text = "userId");

-- 4. Verify the policies are created
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination'
ORDER BY policyname;
