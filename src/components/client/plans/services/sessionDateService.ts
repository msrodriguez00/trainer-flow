
import { supabase } from "@/integrations/supabase/client";

// Updated return type to include 'warning'
type SessionDateServiceResult = {
  success: boolean;
  data?: any;
  error?: any;
  warning?: string;
};

/**
 * Updates the scheduled date of a session in the database
 */
export async function updateSessionDate(
  sessionId: string, 
  clientId: string, 
  date: Date | null
): Promise<SessionDateServiceResult> {
  try {
    console.log("1. Iniciando actualización de fecha de sesión:", {
      sessionId,
      clientId,
      newDate: date?.toISOString() || null
    });

    // Verificar que la sesión existe y pertenece al cliente actual
    const { data: sessionCheck, error: checkError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("client_id", clientId)
      .single();
      
    if (checkError) {
      console.error("Error verificando permisos de sesión:", checkError);
      return {
        success: false,
        error: {
          message: "No tienes permisos para modificar esta sesión",
          details: checkError
        }
      };
    }

    console.log("2. Datos de sesión antes de actualizar:", sessionCheck);
    console.log("3. Ejecutando query para actualizar fecha:");
    
    // Actualizar la fecha de la sesión
    const { data, error } = await supabase
      .from("sessions")
      .update({ scheduled_date: date?.toISOString() || null })
      .eq("id", sessionId)
      .eq("client_id", clientId)
      .select();

    if (error) {
      console.error("4. ERROR en la actualización de fecha:", error);
      console.error("  - Código:", error.code);
      console.error("  - Mensaje:", error.message);
      console.error("  - Detalles:", error.details);
      return {
        success: false,
        error: {
          message: `No se pudo actualizar la fecha: ${error.message}`,
          details: error
        }
      };
    }

    console.log("4. Respuesta exitosa de la actualización:", data);

    // Verificar si la actualización fue realmente efectuada
    const { data: afterData, error: afterError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (afterError) {
      console.error("5. Error al verificar la sesión después de actualizar:", afterError);
      return { 
        success: true, 
        data: data,
        error: {
          message: "Se actualizó pero no se pudo verificar",
          details: afterError
        }
      };
    }
    
    console.log("5. Datos de sesión después de actualizar:", afterData);
    console.log("   - scheduled_date actualizada:", afterData.scheduled_date);
    
    // Validar si la actualización fue exitosa
    const isDateEqual = date 
      ? afterData.scheduled_date === date.toISOString() 
      : afterData.scheduled_date === null;
    
    if (!isDateEqual) {
      console.warn("6. ADVERTENCIA: Fecha persistida diferente a la solicitada");
      return {
        success: true,
        data: afterData,
        warning: "La fecha puede no haberse actualizado correctamente"
      };
    }

    return { 
      success: true, 
      data: afterData 
    };
  } catch (error) {
    console.error("Error inesperado en updateSessionDate:", error);
    return {
      success: false,
      error: {
        message: "Ocurrió un error al actualizar la fecha",
        details: error
      }
    };
  }
}
