-- Repair homepage funding aggregate.
--
-- The previous remote RPC resolved `justice_funding` through the runtime
-- search_path and failed under PostgREST with:
--   relation "justice_funding" does not exist
--
-- Keep this function schema-qualified so public metrics never degrade to a
-- misleading $0 when the table itself is available.

DROP FUNCTION IF EXISTS public.get_funding_total();

CREATE OR REPLACE FUNCTION public.get_funding_total()
RETURNS TABLE (
  grant_count bigint,
  total_dollars numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint AS grant_count,
    coalesce(sum(jf.amount_dollars), 0)::numeric AS total_dollars
  FROM public.justice_funding AS jf
  WHERE jf.amount_dollars IS NOT NULL
    AND jf.amount_dollars > 0;
$$;

GRANT EXECUTE ON FUNCTION public.get_funding_total() TO anon;
GRANT EXECUTE ON FUNCTION public.get_funding_total() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_funding_total() TO service_role;
