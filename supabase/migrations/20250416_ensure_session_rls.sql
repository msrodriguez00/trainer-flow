
-- Eliminar políticas existentes para evitar errores
DROP POLICY IF EXISTS "Clients can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Clients can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers can view their clients' sessions" ON public.sessions;

-- Asegurarse de que RLS está habilitado
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir a los clientes ver sus propias sesiones
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

-- Crear política para permitir a los clientes actualizar sus propias sesiones
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

-- Confirmar que las políticas se han aplicado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Session RLS policies applied successfully.';
END $$;
