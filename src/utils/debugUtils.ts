
import { supabase } from "@/integrations/supabase/client";

export const checkSessionRLSPolicies = async () => {
  try {
    console.log("==== DIAGNÓSTICO DE POLÍTICAS RLS PARA SESIONES ====");
    
    // Verificar si RLS está habilitado
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('is_rls_enabled', { table_name: 'sessions' });
    
    if (rlsError) {
      console.error("Error al verificar estado de RLS:", rlsError);
      return;
    }
    
    console.log("RLS habilitado para tabla sessions:", rlsEnabled);
    
    // Verificar políticas existentes
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'sessions' });
    
    if (policiesError) {
      console.error("Error al obtener políticas:", policiesError);
      return;
    }
    
    console.log("Políticas RLS para tabla sessions:", policies);
    
    // Verificar usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Error al obtener usuario actual:", authError);
      return;
    }
    
    console.log("Usuario actual:", user?.id);
    
    console.log("==== FIN DE DIAGNÓSTICO ====");
  } catch (error) {
    console.error("Error en diagnóstico de RLS:", error);
  }
};

// Función para crear políticas RLS si no existen
export const ensureSessionRLSPolicies = async () => {
  try {
    console.log("Intentando aplicar políticas RLS para sesiones...");
    
    // Intenta llamar a la función edge que aplica las políticas
    const { data, error } = await supabase.functions.invoke('apply-session-rls', {});
    
    if (error) {
      console.error("Error al aplicar políticas RLS:", error);
      return { success: false, message: error.message };
    }
    
    console.log("Respuesta de la función apply-session-rls:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error al aplicar políticas RLS:", error);
    return { success: false, message: String(error) };
  }
};

// Función genérica para registrar el estado de un objeto
export const logObject = (label: string, obj: any) => {
  console.log(`===== ${label} =====`);
  console.log(JSON.stringify(obj, null, 2));
  console.log("=".repeat(label.length + 12));
};
