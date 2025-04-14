
import { supabase } from "@/integrations/supabase/client";

export const checkSessionRLSPolicies = async () => {
  try {
    console.log("==== DIAGNÓSTICO DE POLÍTICAS RLS PARA SESIONES ====");
    
    // Use custom SQL query instead of RPC function
    const { data: rlsEnabled, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'sessions')
      .single();
    
    if (rlsError) {
      console.error("Error al verificar estado de RLS:", rlsError);
      return;
    }
    
    console.log("RLS habilitado para tabla sessions:", rlsEnabled?.rowsecurity || false);
    
    // Get policies using a direct query instead of RPC
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'sessions');
    
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

// Función para aplicar políticas RLS directamente usando la API REST
export const ensureSessionRLSPolicies = async () => {
  try {
    console.log("Aplicando políticas RLS para sesiones...");
    
    // Apply policies manually via REST endpoint
    const { data, error } = await supabase.functions.invoke('apply-session-rls', {
      body: { forceApply: true }
    });
    
    if (error) {
      console.error("Error al aplicar políticas RLS:", error);
      return { success: false, message: error.message };
    }
    
    console.log("Respuesta al aplicar políticas RLS:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error al aplicar políticas RLS:", error);
    return { success: false, message: String(error) };
  }
};

// Función para registrar el estado de un objeto
export const logObject = (label: string, obj: any) => {
  console.log(`===== ${label} =====`);
  console.log(JSON.stringify(obj, null, 2));
  console.log("=".repeat(label.length + 12));
};

// Función para depurar errores de actualización de sesiones
export const debugUpdateSession = async (sessionId: string, date: Date) => {
  try {
    console.log(`==== DEPURACIÓN DE ACTUALIZACIÓN DE SESIÓN ${sessionId} ====`);
    
    // 1. Verificar permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Error de autenticación:", authError);
      return { success: false, message: "Error de autenticación" };
    }
    
    console.log("Usuario autenticado:", user?.id);
    
    // 2. Obtener el plan_id asociado a la sesión
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('plan_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError);
      return { success: false, message: "Error al obtener la sesión" };
    }
    
    console.log("Plan ID asociado a la sesión:", sessionData.plan_id);
    
    // 3. Verificar relación del cliente con el plan
    const { data: clientPlan, error: planError } = await supabase
      .from('plans')
      .select('client_id')
      .eq('id', sessionData.plan_id)
      .single();
    
    if (planError) {
      console.error("Error al obtener el plan:", planError);
      return { success: false, message: "Error al obtener el plan" };
    }
    
    console.log("Client ID del plan:", clientPlan.client_id);
    console.log("¿Coincide con usuario?", clientPlan.client_id === user?.id);
    
    // 4. Intentar la actualización
    console.log(`Intentando actualizar fecha a: ${date.toISOString()}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('sessions')
      .update({ scheduled_date: date.toISOString() })
      .eq('id', sessionId)
      .select();
    
    if (updateError) {
      console.error("Error en actualización:", updateError);
      return { success: false, message: updateError.message };
    }
    
    console.log("Resultado de actualización:", updateResult);
    
    // 5. Verificar el estado después de la actualización
    const { data: afterUpdate, error: checkError } = await supabase
      .from('sessions')
      .select('scheduled_date')
      .eq('id', sessionId)
      .single();
    
    if (checkError) {
      console.error("Error al verificar actualización:", checkError);
      return { success: false, message: "Error al verificar actualización" };
    }
    
    console.log("Fecha después de actualización:", afterUpdate?.scheduled_date);
    console.log("¿Coincide con fecha deseada?", afterUpdate?.scheduled_date === date.toISOString());
    
    console.log("==== FIN DE DEPURACIÓN ====");
    
    return { 
      success: true, 
      updated: afterUpdate?.scheduled_date === date.toISOString(),
      currentDate: afterUpdate?.scheduled_date
    };
  } catch (error) {
    console.error("Error general en depuración:", error);
    return { success: false, message: String(error) };
  }
};
