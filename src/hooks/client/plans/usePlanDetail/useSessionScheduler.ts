
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScheduleSessionOptions } from "./types";
import { debugUpdateSession } from "@/utils/debugUtils";

export const useSessionScheduler = () => {
  const { toast } = useToast();

  const scheduleSession = async ({
    sessionId,
    date,
    clientId,
    onSuccess,
    onError
  }: ScheduleSessionOptions): Promise<boolean> => {
    try {
      console.log(`usePlanDetail - Iniciando programación de sesión ${sessionId} para fecha ${date.toISOString()}`);
      
      if (!clientId) {
        console.error("usePlanDetail - Error: Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }

      // Usar método directo sin verificaciones previas
      const { data, error } = await supabase
        .from('sessions')
        .update({ scheduled_date: date.toISOString() })
        .eq('id', sessionId)
        .select('*');

      if (error) {
        console.error("usePlanDetail - Error actualizando fecha de la sesión:", error);
        
        // Intentar debug para entender el problema
        const debugResult = await debugUpdateSession(sessionId, date);
        console.log("Resultado depuración:", debugResult);
        
        toast({
          title: "Error",
          description: `No se pudo programar la sesión: ${error.message}`,
          variant: "destructive",
        });
        
        if (onError) {
          onError(error);
        }
        
        throw error;
      }
      
      console.log("usePlanDetail - Actualización exitosa de la sesión:", data);
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("usePlanDetail - Error general programando sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo programar la sesión. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      throw error;
    }
  };

  return {
    scheduleSession
  };
};
