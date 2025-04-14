
import { supabase } from "@/integrations/supabase/client";
import { Plan, Session, Series, PlanExercise } from "@/types";
import { toast } from "@/hooks/use-toast";

/**
 * Fetches a plan including all its sessions, series and exercises
 */
export async function fetchPlanDetails(planId: string, clientId: string): Promise<Plan | null> {
  try {
    console.log("Fetching plan details for ID:", planId, "client ID:", clientId);

    // Log RLS policy information
    console.log("DEBUG: Verificando permisos para el client_id:", clientId);
    
    // Get the plan
    console.log("DEBUG: Ejecutando consulta para obtener plan");
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select(`
        id,
        name,
        created_at,
        month
      `)
      .eq("id", planId)
      .eq("client_id", clientId)
      .single();

    if (planError) {
      console.error("Error fetching plan:", planError);
      console.error("  - Código:", planError.code);
      console.error("  - Mensaje:", planError.message);
      console.error("  - Detalles:", planError.details);
      toast({
        title: "Error",
        description: "No se pudo cargar el plan",
        variant: "destructive",
      });
      return null;
    }

    if (!planData) {
      console.log("No plan found with ID:", planId);
      return null;
    }

    console.log("DEBUG: Plan encontrado:", planData);
    
    // Get sessions for this plan
    console.log("DEBUG: Consultando sesiones para el plan");
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        id,
        name,
        order_index,
        scheduled_date,
        client_id
      `)
      .eq("plan_id", planData.id)
      .order("order_index", { ascending: true });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      console.error("  - Código:", sessionsError.code);
      console.error("  - Mensaje:", sessionsError.message);
      console.error("  - Detalles:", sessionsError.details);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones del plan",
        variant: "destructive",
      });
      return null;
    }

    console.log("DEBUG: Sesiones encontradas:", sessionsData);
    
    const sessions: Session[] = [];

    // For each session, get the series and exercises
    for (const session of (sessionsData || [])) {
      console.log("DEBUG: Procesando sesión:", session.id);
      console.log("  - client_id de la sesión:", session.client_id);
      
      // Get series
      const seriesList = await fetchSeriesForSession(session.id, clientId);
      
      sessions.push({
        id: session.id,
        name: session.name,
        orderIndex: session.order_index,
        scheduledDate: session.scheduled_date,
        series: seriesList
      });
    }

    // Flatten exercises for compatibility with existing structure
    const allExercises: PlanExercise[] = [];
    sessions.forEach(session => {
      session.series.forEach(series => {
        allExercises.push(...series.exercises);
      });
    });

    const fullPlan: Plan = {
      id: planData.id,
      name: planData.name,
      clientId: clientId,
      createdAt: planData.created_at,
      month: planData.month,
      sessions: sessions,
      exercises: allExercises
    };

    console.log("Plan completo cargado:", fullPlan);
    return fullPlan;
    
  } catch (error) {
    console.error("Error en fetchPlanDetails:", error);
    toast({
      title: "Error",
      description: "Ocurrió un error al cargar el plan",
      variant: "destructive",
    });
    return null;
  }
}

/**
 * Fetches all series for a given session
 */
async function fetchSeriesForSession(sessionId: string, clientId: string): Promise<Series[]> {
  // Get series
  const { data: seriesData, error: seriesError } = await supabase
    .from("series")
    .select(`
      id,
      name,
      order_index,
      client_id
    `)
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });

  if (seriesError) {
    console.error("Error fetching series:", seriesError);
    return [];
  }

  console.log("DEBUG: Series encontradas:", seriesData?.length || 0);

  const seriesList: Series[] = [];

  // For each series, get the exercises
  for (const serie of (seriesData || [])) {
    console.log("DEBUG: Procesando serie:", serie.id);
    console.log("  - client_id de la serie:", serie.client_id);
    
    // Get exercises
    const exercises = await fetchExercisesForSeries(serie.id);
    
    seriesList.push({
      id: serie.id,
      name: serie.name,
      orderIndex: serie.order_index,
      exercises: exercises
    });
  }
  
  return seriesList;
}

/**
 * Fetches all exercises for a given series
 */
async function fetchExercisesForSeries(seriesId: string): Promise<PlanExercise[]> {
  // Get exercises with a JOIN to get all exercise details
  const { data: planExercises, error: exercisesError } = await supabase
    .from("plan_exercises")
    .select(`
      id,
      exercise_id,
      level,
      exercises:exercise_id (*)
    `)
    .eq("series_id", seriesId);

  if (exercisesError) {
    console.error("Error fetching exercises:", exercisesError);
    return [];
  }
  
  const exercisesWithNames = planExercises?.map(ex => ({
    exerciseId: ex.exercise_id,
    exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
    level: ex.level,
    evaluations: []
  })) || [];
  
  return exercisesWithNames;
}
