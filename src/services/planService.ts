
import { supabase } from "@/integrations/supabase/client";
import { Plan, Client, Session, Series, PlanExercise } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const fetchPlans = async (userId: string): Promise<Plan[]> => {
  console.log("Plan service - Starting to fetch plans for trainer:", userId);
  
  try {
    console.log("Plan service - Fetching basic plan data from supabase");
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select(`
        id,
        name,
        client_id,
        created_at
      `)
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false });

    if (plansError) {
      console.error("Plan service - Error fetching basic plan data:", plansError);
      throw plansError;
    }

    console.log(`Plan service - Successfully fetched ${plansData?.length || 0} plans, now fetching details`);
    
    const formattedPlans: Plan[] = [];
    
    for (const plan of plansData || []) {
      console.log(`Plan service - Processing plan: ${plan.id} - ${plan.name}`);
      try {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`id, name, order_index`)
          .eq("plan_id", plan.id)
          .order("order_index", { ascending: true });
          
        if (sessionsError) {
          console.error(`Plan service - Error fetching sessions for plan ${plan.id}:`, sessionsError);
          throw sessionsError;
        }
        
        console.log(`Plan service - Fetched ${sessionsData?.length || 0} sessions for plan ${plan.id}`);
        
        const sessions: Session[] = [];
        
        for (const session of sessionsData || []) {
          console.log(`Plan service - Processing session: ${session.id} for plan ${plan.id}`);
          try {
            const { data: seriesData, error: seriesError } = await supabase
              .from("series")
              .select(`id, name, order_index`)
              .eq("session_id", session.id)
              .order("order_index", { ascending: true });
              
            if (seriesError) {
              console.error(`Plan service - Error fetching series for session ${session.id}:`, seriesError);
              throw seriesError;
            }
            
            console.log(`Plan service - Fetched ${seriesData?.length || 0} series for session ${session.id}`);
            
            const seriesList: Series[] = [];
            
            for (const series of seriesData || []) {
              console.log(`Plan service - Processing series: ${series.id} for session ${session.id}`);
              try {
                const { data: exercisesData, error: exercisesError } = await supabase
                  .from("plan_exercises")
                  .select(`
                    id, exercise_id, level,
                    exercises:exercise_id (name),
                    evaluations (*)
                  `)
                  .eq("series_id", series.id);
                  
                if (exercisesError) {
                  console.error(`Plan service - Error fetching exercises for series ${series.id}:`, exercisesError);
                  throw exercisesError;
                }
                
                console.log(`Plan service - Fetched ${exercisesData?.length || 0} exercises for series ${series.id}`);
                
                const exercises: PlanExercise[] = exercisesData.map((ex: any) => {
                  const mappedEvaluations = ex.evaluations ? ex.evaluations.map((evaluation: any) => ({
                    timeRating: evaluation.time_rating,
                    weightRating: evaluation.weight_rating,
                    repetitionsRating: evaluation.repetitions_rating,
                    exerciseRating: evaluation.exercise_rating,
                    comment: evaluation.comment,
                    date: evaluation.date
                  })) : [];
                  
                  return {
                    exerciseId: ex.exercise_id,
                    exerciseName: ex.exercises?.name,
                    level: ex.level,
                    evaluations: mappedEvaluations
                  }
                });
                
                seriesList.push({
                  id: series.id,
                  name: series.name,
                  orderIndex: series.order_index,
                  exercises
                });
              } catch (seriesError) {
                console.error(`Plan service - Error processing series ${series.id}:`, seriesError);
                // Continue with other series despite this error
              }
            }
            
            sessions.push({
              id: session.id,
              name: session.name,
              orderIndex: session.order_index,
              series: seriesList
            });
          } catch (sessionError) {
            console.error(`Plan service - Error processing session ${session.id}:`, sessionError);
            // Continue with other sessions despite this error
          }
        }
        
        console.log(`Plan service - Calculating all exercises for plan ${plan.id}`);
        const allExercises: PlanExercise[] = [];
        sessions.forEach(session => {
          session.series.forEach(series => {
            allExercises.push(...series.exercises);
          });
        });
        
        console.log(`Plan service - Plan ${plan.id} has ${allExercises.length} total exercises`);
        
        formattedPlans.push({
          id: plan.id,
          name: plan.name,
          clientId: plan.client_id,
          createdAt: plan.created_at,
          sessions,
          exercises: allExercises
        });
      } catch (planError) {
        console.error(`Plan service - Error processing plan ${plan.id}:`, planError);
        // Continue with other plans despite this error
      }
    }
    
    console.log(`Plan service - Completed processing ${formattedPlans.length} plans`);
    return formattedPlans;
  } catch (error) {
    console.error("Plan service - Error in fetchPlans:", error);
    throw error;
  }
};

export const fetchClientsForTrainer = async (userId: string): Promise<Client[]> => {
  console.log("Plan service - Fetching clients for trainer:", userId);
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("trainer_id", userId);

    if (error) {
      console.error("Plan service - Error fetching clients:", error);
      throw error;
    }

    console.log(`Plan service - Successfully fetched ${data?.length || 0} clients`);
    return data || [];
  } catch (error) {
    console.error("Plan service - Error in fetchClientsForTrainer:", error);
    throw error;
  }
};

export const deletePlan = async (planId: string): Promise<void> => {
  console.log("Plan service - Deleting plan:", planId);
  try {
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", planId);

    if (error) {
      console.error("Plan service - Error deleting plan:", error);
      throw error;
    }

    console.log(`Plan service - Successfully deleted plan ${planId}`);
  } catch (error) {
    console.error("Plan service - Error in deletePlan:", error);
    throw error;
  }
};
