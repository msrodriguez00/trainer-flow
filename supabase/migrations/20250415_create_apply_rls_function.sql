
-- Create function to apply RLS policies
CREATE OR REPLACE FUNCTION public.apply_session_rls_policies()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Enable RLS on the sessions table
  ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  
  -- Drop policies if they exist to prevent errors
  DROP POLICY IF EXISTS "Clients can view their own sessions" ON public.sessions;
  DROP POLICY IF EXISTS "Clients can update their own sessions" ON public.sessions;
  
  -- Create policies
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
END;
$$;
