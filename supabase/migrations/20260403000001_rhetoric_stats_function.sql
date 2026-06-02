-- Migration to create the get_rhetoric_stats function for fast Hansard analysis
CREATE OR REPLACE FUNCTION public.get_rhetoric_stats(p_region text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_speeches', count(*),
    'detention_mentions', count(*) FILTER (WHERE subject ILIKE '%detention%' OR body_text ILIKE '%detention%'),
    'alternative_mentions', count(*) FILTER (WHERE body_text ILIKE '%alternative%' OR body_text ILIKE '%diversion%' OR body_text ILIKE '%community-based%')
  ) INTO v_result
  FROM civic_hansard
  WHERE
    (p_region IS NULL OR jurisdiction ILIKE '%' || p_region || '%')
    AND (
      p_region IS NOT NULL
      OR subject ILIKE '%youth justice%'
      OR subject ILIKE '%detention%'
      OR body_text ILIKE '%youth justice%'
    );

  RETURN v_result;
END;
$$;

-- Grant permissions for API usage
GRANT EXECUTE ON FUNCTION public.get_rhetoric_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rhetoric_stats(text) TO anon;
