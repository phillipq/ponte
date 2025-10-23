-- Force open access for all authenticated users
-- This script completely removes all restrictions

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY TO RESET
-- =====================================================

-- Disable RLS on both tables
ALTER TABLE "Property" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Destination" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP ALL EXISTING POLICIES (if any remain)
-- =====================================================

-- Drop all policies on Property table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Property') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "Property"';
    END LOOP;
END $$;

-- Drop all policies on Destination table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'Destination') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "Destination"';
    END LOOP;
END $$;

-- =====================================================
-- 3. RE-ENABLE RLS
-- =====================================================

ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Destination" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CREATE SINGLE, SIMPLE POLICIES
-- =====================================================

-- Property table - single policy for all operations
CREATE POLICY "property_all_access" ON "Property"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Destination table - single policy for all operations  
CREATE POLICY "destination_all_access" ON "Destination"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 5. VERIFY POLICIES ARE CREATED
-- =====================================================

-- Check Property policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Property';

-- Check Destination policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'Destination';

-- =====================================================
-- 6. TEST DATA ACCESS
-- =====================================================

-- Test if all properties are accessible
SELECT COUNT(*) as total_properties FROM "Property";
SELECT id, name, "userId" FROM "Property" ORDER BY name;

-- Test if all destinations are accessible
SELECT COUNT(*) as total_destinations FROM "Destination";
SELECT id, name, "userId" FROM "Destination" ORDER BY name;

-- =====================================================
-- 7. CHECK RLS STATUS
-- =====================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('Property', 'Destination')
ORDER BY tablename;
