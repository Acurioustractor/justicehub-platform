-- Fix is_admin() function to use actual schema
-- Run this in Supabase Dashboard → SQL Editor

-- Drop and recreate the function with correct column name
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND user_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT is_admin() AS am_i_admin;
