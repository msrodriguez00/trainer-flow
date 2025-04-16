
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types";
import { toast } from "@/hooks/use-toast";

/**
 * Fetches a plan including all its sessions, series and exercises using an optimized database function
 */
export async function fetchPlanDetails(planId: string, clientId: string): Promise<Plan | null> {
  try {
    console.log("Fetching plan details for ID:", planId, "client ID:", clientId);
    
    // Call the database function that returns the complete plan structure in a single query
    const { data, error } = await supabase.rpc('get_complete_plan', {
      p_plan_id: planId,
      p_client_id: clientId
    });

    if (error) {
      console.error("Error fetching plan details:", error);
      console.error("  - Código:", error.code);
      console.error("  - Mensaje:", error.message);
      console.error("  - Detalles:", error.details);
      toast({
        title: "Error",
        description: "No se pudo cargar el plan",
        variant: "destructive",
      });
      return null;
    }

    if (!data) {
      console.log("No plan found with ID:", planId);
      return null;
    }
    
    console.log("Plan complete data loaded successfully");
    
    // Cast the data to any to allow property access
    const planData = data as any;
    
    // The data returned from the database function should already be in the correct format
    const plan: Plan = {
      id: planData.id,
      name: planData.name,
      clientId: planData.clientId,
      createdAt: planData.createdAt,
      month: planData.month,
      sessions: planData.sessions || [],
      exercises: planData.exercises || []
    };

    return plan;
    
  } catch (error) {
    console.error("Error in fetchPlanDetails:", error);
    toast({
      title: "Error",
      description: "Ocurrió un error al cargar el plan",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * This function is kept for backward compatibility but is no longer used directly
 * since all series are now loaded with the plan in a single query
 */
async function fetchSeriesForSession(sessionId: string, clientId: string) {
  console.warn("fetchSeriesForSession is deprecated - all series should now be loaded with the plan");
  return [];
}

/**
 * This function is kept for backward compatibility but is no longer used directly
 * since all exercises are now loaded with the plan in a single query
 */
async function fetchExercisesForSeries(seriesId: string) {
  console.warn("fetchExercisesForSeries is deprecated - all exercises should now be loaded with the plan");
  return [];
}
