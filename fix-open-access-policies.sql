-- Fix RLS policies to allow all authenticated users to view all data
-- This ensures any logged-in user can see all properties and destinations

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all policies on Property table
DROP POLICY IF EXISTS "authenticated_modify_all" ON "Property";
DROP POLICY IF EXISTS "properties_read_all" ON "Property";
DROP POLICY IF EXISTS "properties_create" ON "Property";
DROP POLICY IF EXISTS "properties_update_own" ON "Property";
DROP POLICY IF EXISTS "properties_delete_own" ON "Property";

-- Drop all policies on Destination table
DROP POLICY IF EXISTS "authenticated_modify_all" ON "Destination";
DROP POLICY IF EXISTS "destinations_read_all" ON "Destination";
DROP POLICY IF EXISTS "destinations_create" ON "Destination";
DROP POLICY IF EXISTS "destinations_update_own" ON "Destination";
DROP POLICY IF EXISTS "destinations_delete_own" ON "Destination";

-- =====================================================
-- 2. CREATE OPEN ACCESS POLICIES
-- =====================================================

-- Property table - allow all authenticated users to read all properties
CREATE POLICY "properties_open_read" ON "Property"
  FOR SELECT TO authenticated USING (true);

-- Property table - allow all authenticated users to create properties
CREATE POLICY "properties_open_create" ON "Property"
  FOR INSERT TO authenticated WITH CHECK (true);

-- Property table - allow all authenticated users to update any property
CREATE POLICY "properties_open_update" ON "Property"
  FOR UPDATE TO authenticated USING (true);

-- Property table - allow all authenticated users to delete any property
CREATE POLICY "properties_open_delete" ON "Property"
  FOR DELETE TO authenticated USING (true);

-- Destination table - allow all authenticated users to read all destinations
CREATE POLICY "destinations_open_read" ON "Destination"
  FOR SELECT TO authenticated USING (true);

-- Destination table - allow all authenticated users to create destinations
CREATE POLICY "destinations_open_create" ON "Destination"
  FOR INSERT TO authenticated WITH CHECK (true);

-- Destination table - allow all authenticated users to update any destination
CREATE POLICY "destinations_open_update" ON "Destination"
  FOR UPDATE TO authenticated USING (true);

-- Destination table - allow all authenticated users to delete any destination
CREATE POLICY "destinations_open_delete" ON "Destination"
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. VERIFY POLICIES
-- =====================================================

-- Check Property policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Property'
ORDER BY policyname;

-- Check Destination policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination'
ORDER BY policyname;

-- =====================================================
-- 4. TEST DATA ACCESS
-- =====================================================

-- Test if all properties are accessible
SELECT COUNT(*) as total_properties FROM "Property";
SELECT id, name, "userId" FROM "Property" ORDER BY name;

-- Test if all destinations are accessible
SELECT COUNT(*) as total_destinations FROM "Destination";
SELECT id, name, "userId" FROM "Destination" ORDER BY name;
