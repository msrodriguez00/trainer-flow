
-- Create RLS policy to allow clients to view their own sessions
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

-- Create RLS policy to allow clients to update their own sessions
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

-- Make sure RLS is enabled on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
