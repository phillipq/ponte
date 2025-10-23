-- Fix RLS policies for properties table
-- This script ensures properties can be read by all authenticated users

-- 1. Check current RLS status and policies for properties
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'Property';

SELECT 
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Property';

-- 2. Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "property_access" ON "Property";
DROP POLICY IF EXISTS "property_modify_own" ON "Property";
DROP POLICY IF EXISTS "authenticated_full_access" ON "Property";

-- 3. Create simple, permissive policies for properties
-- Allow all authenticated users to read all properties
CREATE POLICY "properties_read_all" ON "Property"
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create properties
CREATE POLICY "properties_create" ON "Property"
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update their own properties
CREATE POLICY "properties_update_own" ON "Property"
  FOR UPDATE TO authenticated USING (auth.uid()::text = "userId");

-- Allow users to delete their own properties
CREATE POLICY "properties_delete_own" ON "Property"
  FOR DELETE TO authenticated USING (auth.uid()::text = "userId");

-- 4. Verify the policies are created
SELECT 
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Property'
ORDER BY policyname;
