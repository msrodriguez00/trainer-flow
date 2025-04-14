
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan, Session, Series, PlanExercise } from "@/types";

export const fetchDashboardStats = async (userId: string) => {
  try {
    const { count: exercisesCount, error: exercisesError } = await supabase
      .from("exercises")
      .select('*', { count: 'exact', head: true });
    
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    const { count: plansCount, error: plansError } = await supabase
      .from("plans")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    if (exercisesError || clientsError || plansError) {
      throw new Error("Error fetching stats");
    }
    
    return {
      exercises: exercisesCount || 0,
      clients: clientsCount || 0,
      plans: plansCount || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

export const fetchRecentPlans = async (userId: string): Promise<Plan[]> => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select(`
        id,
        name,
        client_id,
        created_at
      `)
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    const formattedPlans: Plan[] = [];
      
    for (const planData of data) {
      // Fetch sessions for this plan
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(`id, name, order_index`)
        .eq("plan_id", planData.id)
        .order("order_index", { ascending: true });
        
      if (sessionsError) throw sessionsError;
      
      const sessions: Session[] = [];
      
      for (const sessionData of sessionsData) {
        // Fetch series for this session
        const { data: seriesData, error: seriesError } = await supabase
          .from("series")
          .select(`id, name, order_index`)
          .eq("session_id", sessionData.id)
          .order("order_index", { ascending: true });
          
        if (seriesError) throw seriesError;
        
        const seriesList: Series[] = [];
        
        for (const seriesItem of seriesData) {
          // Fetch exercises for this series
          const { data: exercisesData, error: exercisesError } = await supabase
            .from("plan_exercises")
            .select(`
              id, exercise_id, level,
              exercises:exercise_id (name)
            `)
            .eq("series_id", seriesItem.id);
            
          if (exercisesError) throw exercisesError;
          
          const exercises: PlanExercise[] = exercisesData.map((ex: any) => ({
            exerciseId: ex.exercise_id,
            exerciseName: ex.exercises?.name,
            level: ex.level,
            evaluations: []
          }));
          
          seriesList.push({
            id: seriesItem.id,
            name: seriesItem.name,
            orderIndex: seriesItem.order_index,
            exercises
          });
        }
        
        sessions.push({
          id: sessionData.id,
          name: sessionData.name,
          orderIndex: sessionData.order_index,
          series: seriesList
        });
      }
      
      // Flatten exercises for backward compatibility
      const allExercises: PlanExercise[] = [];
      sessions.forEach(session => {
        session.series.forEach(series => {
          allExercises.push(...series.exercises);
        });
      });
      
      formattedPlans.push({
        id: planData.id,
        name: planData.name,
        clientId: planData.client_id,
        createdAt: planData.created_at,
        sessions,
        exercises: allExercises
      });
    }

    return formattedPlans;
  } catch (error) {
    console.error("Error fetching recent plans:", error);
    throw error;
  }
};

export const fetchRecentClients = async (userId: string): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching recent clients:", error);
    throw error;
  }
};
