-- Fix overlapping RLS policies
-- Remove redundant policies to eliminate performance warnings and conflicts

-- =====================================================
-- 1. FIX PROPERTIES TABLE
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "properties_read_all" ON "Property";
DROP POLICY IF EXISTS "properties_create" ON "Property";
DROP POLICY IF EXISTS "properties_update_own" ON "Property";
DROP POLICY IF EXISTS "properties_delete_own" ON "Property";

-- Keep only the comprehensive policy
-- The "authenticated_modify_all" policy already covers all operations

-- =====================================================
-- 2. FIX DESTINATIONS TABLE
-- =====================================================

-- Drop the overlapping policies
DROP POLICY IF EXISTS "destinations_read_all" ON "Destination";
DROP POLICY IF EXISTS "destinations_create" ON "Destination";
DROP POLICY IF EXISTS "destinations_update_own" ON "Destination";
DROP POLICY IF EXISTS "destinations_delete_own" ON "Destination";

-- Keep only the comprehensive policy
-- The "authenticated_modify_all" policy already covers all operations

-- =====================================================
-- 3. VERIFY NO OVERLAPPING POLICIES
-- =====================================================

-- Check properties policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Property'
ORDER BY policyname;

-- Check destinations policies  
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination'
ORDER BY policyname;

-- =====================================================
-- 4. TEST DATA ACCESS
-- =====================================================

-- Test if we can access properties
SELECT COUNT(*) as property_count FROM "Property";

-- Test if we can access destinations
SELECT COUNT(*) as destination_count FROM "Destination";

-- Show sample data
SELECT id, name, "userId" FROM "Property" LIMIT 5;
SELECT id, name, "userId" FROM "Destination" LIMIT 5;
