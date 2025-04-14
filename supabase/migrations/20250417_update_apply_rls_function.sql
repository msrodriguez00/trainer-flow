
-- Drop the function if it exists to avoid errors
DROP FUNCTION IF EXISTS public.apply_session_rls_policies();

-- Create an updated function to apply RLS policies that is more reliable
CREATE OR REPLACE FUNCTION public.apply_session_rls_policies()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  policy_exists boolean;
BEGIN
  -- Enable RLS on the sessions table first
  ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  
  -- Check if "Clients can view their own sessions" policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Clients can view their own sessions'
  ) INTO policy_exists;
  
  -- Drop the policy if it exists
  IF policy_exists THEN
    DROP POLICY "Clients can view their own sessions" ON public.sessions;
  END IF;
  
  -- Create the SELECT policy
  CREATE POLICY "Clients can view their own sessions" ON public.sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.plans
      WHERE plans.id = sessions.plan_id
      AND plans.client_id = auth.uid()
    )
  );
  
  -- Check if "Clients can update their own sessions" policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sessions' 
    AND policyname = 'Clients can update their own sessions'
  ) INTO policy_exists;
  
  -- Drop the policy if it exists
  IF policy_exists THEN
    DROP POLICY "Clients can update their own sessions" ON public.sessions;
  END IF;
  
  -- Create the UPDATE policy
  CREATE POLICY "Clients can update their own sessions" ON public.sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.plans
      WHERE plans.id = sessions.plan_id
      AND plans.client_id = auth.uid()
    )
  );
  
  -- Return success
  RETURN true;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION public.apply_session_rls_policies() IS 'Applies RLS policies to sessions table to allow clients to view and update their own sessions';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_session_rls_policies() TO authenticated;
