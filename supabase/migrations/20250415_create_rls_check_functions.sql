
-- Función para verificar si RLS está habilitado en una tabla
CREATE OR REPLACE FUNCTION public.is_rls_enabled(table_name text) 
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = table_name 
    AND rowsecurity = true
  );
END;
$$;

-- Función para obtener todas las políticas RLS de una tabla
CREATE OR REPLACE FUNCTION public.get_policies_for_table(table_name text) 
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'policy_name', polname,
        'table_name', tablename,
        'command', 
          CASE polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            ELSE polcmd::text
          END,
        'permissive', polpermissive
      )
    )
    FROM pg_policy
    JOIN pg_class ON pg_policy.polrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE tablename = table_name
    AND nspname = 'public'
  );
END;
$$;

-- Asegurar los permisos correctos
ALTER FUNCTION public.is_rls_enabled SECURITY DEFINER;
ALTER FUNCTION public.get_policies_for_table SECURITY DEFINER;

-- Otorgar privilegios de ejecución
GRANT EXECUTE ON FUNCTION public.is_rls_enabled TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_policies_for_table TO authenticated;
