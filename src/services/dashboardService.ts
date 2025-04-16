
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan, Session, Series, PlanExercise } from "@/types";

export const fetchDashboardStats = async (userId: string) => {
  try {
    console.log("Dashboard service - Fetching exercises count");
    const { count: exercisesCount, error: exercisesError } = await supabase
      .from("exercises")
      .select('*', { count: 'exact', head: true });
    
    console.log("Dashboard service - Fetching clients count");
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    console.log("Dashboard service - Fetching plans count");
    const { count: plansCount, error: plansError } = await supabase
      .from("plans")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    if (exercisesError) {
      console.error("Dashboard service - Error fetching exercises count:", exercisesError);
      throw exercisesError;
    }
    
    if (clientsError) {
      console.error("Dashboard service - Error fetching clients count:", clientsError);
      throw clientsError;
    }
    
    if (plansError) {
      console.error("Dashboard service - Error fetching plans count:", plansError);
      throw plansError;
    }
    
    return {
      exercises: exercisesCount || 0,
      clients: clientsCount || 0,
      plans: plansCount || 0,
    };
  } catch (error) {
    console.error("Dashboard service - Error fetching stats:", error);
    throw error;
  }
};

export const fetchRecentPlans = async (userId: string): Promise<Plan[]> => {
  try {
    console.log("Dashboard service - Fetching basic plan data");
    
    // Step 1: Get basic plan data first
    const { data: planBasicData, error: planError } = await supabase
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

    if (planError) {
      console.error("Dashboard service - Error fetching plans:", planError);
      throw planError;
    }
    
    if (!planBasicData || planBasicData.length === 0) {
      console.log("Dashboard service - No plans found for user");
      return [];
    }
    
    console.log("Dashboard service - Found", planBasicData.length, "plans");
    
    const formattedPlans: Plan[] = [];
      
    for (const planData of planBasicData) {
      try {
        console.log(`Plan service - Processing plan ${planData.id}`);
        
        // Step 2: Fetch sessions for this plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`id, name, order_index`)
          .eq("plan_id", planData.id)
          .order("order_index", { ascending: true });
          
        if (sessionsError) {
          console.error(`Plan service - Error fetching sessions for plan ${planData.id}:`, sessionsError);
          // Don't throw, just continue with empty sessions
          formattedPlans.push({
            id: planData.id,
            name: planData.name,
            clientId: planData.client_id,
            createdAt: planData.created_at,
            sessions: [],
            exercises: []
          });
          continue;
        }
        
        console.log(`Plan service - Fetched ${sessionsData?.length || 0} sessions for plan ${planData.id}`);
        
        const sessions: Session[] = [];
        const allExercises: PlanExercise[] = [];
        
        // Step 3: Process each session
        for (const sessionData of sessionsData || []) {
          try {
            console.log(`Plan service - Processing session: ${sessionData.id} for plan ${planData.id}`);
            
            // Step 4: Fetch series for this session
            const { data: seriesData, error: seriesError } = await supabase
              .from("series")
              .select(`id, name, order_index`)
              .eq("session_id", sessionData.id)
              .order("order_index", { ascending: true });
              
            if (seriesError) {
              console.error(`Plan service - Error fetching series for session ${sessionData.id}:`, seriesError);
              // Don't throw, continue with empty series
              sessions.push({
                id: sessionData.id,
                name: sessionData.name,
                orderIndex: sessionData.order_index,
                series: []
              });
              continue;
            }
            
            console.log(`Plan service - Fetched ${seriesData?.length || 0} series for session ${sessionData.id}`);
            
            const seriesList: Series[] = [];
            
            // Step 5: Process each series
            for (const seriesItem of seriesData || []) {
              try {
                console.log(`Plan service - Processing series: ${seriesItem.id} for session ${sessionData.id}`);
                
                // Step 6: Fetch exercises for this series with a safer query
                const { data: exercisesData, error: exercisesError } = await supabase
                  .from("plan_exercises")
                  .select(`
                    id, exercise_id, level,
                    exercises:exercise_id (name)
                  `)
                  .eq("series_id", seriesItem.id);
                  
                if (exercisesError) {
                  console.error(`Plan service - Error fetching exercises for series ${seriesItem.id}:`, exercisesError);
                  // Don't throw, continue with empty exercises
                  seriesList.push({
                    id: seriesItem.id,
                    name: seriesItem.name,
                    orderIndex: seriesItem.order_index,
                    exercises: []
                  });
                  continue;
                }
                
                // Step 7: Transform exercise data
                const exercises: PlanExercise[] = (exercisesData || []).map((ex: any) => {
                  const planExercise = {
                    exerciseId: ex.exercise_id,
                    exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
                    level: ex.level,
                    evaluations: []
                  };
                  
                  allExercises.push(planExercise);
                  return planExercise;
                });
                
                seriesList.push({
                  id: seriesItem.id,
                  name: seriesItem.name,
                  orderIndex: seriesItem.order_index,
                  exercises
                });
              } catch (seriesError) {
                console.error(`Plan service - Error processing series ${seriesItem.id}:`, seriesError);
              }
            }
            
            sessions.push({
              id: sessionData.id,
              name: sessionData.name,
              orderIndex: sessionData.order_index,
              series: seriesList
            });
          } catch (sessionError) {
            console.error(`Plan service - Error processing session ${sessionData.id}:`, sessionError);
          }
        }
        
        console.log(`Plan service - Calculating all exercises for plan ${planData.id}`);
        console.log(`Plan service - Plan ${planData.id} has ${allExercises.length} total exercises`);
        
        formattedPlans.push({
          id: planData.id,
          name: planData.name,
          clientId: planData.client_id,
          createdAt: planData.created_at,
          sessions,
          exercises: allExercises
        });
      } catch (planProcessError) {
        console.error(`Plan service - Error processing plan ${planData.id}:`, planProcessError);
      }
    }
    
    console.log(`Plan service - Completed processing ${formattedPlans.length} plans`);
    return formattedPlans;
    
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentPlans:", error);
    throw error;
  }
};

export const fetchRecentClients = async (userId: string): Promise<Client[]> => {
  try {
    console.log("Dashboard service - Fetching recent clients for user:", userId);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) {
      console.error("Dashboard service - Error fetching recent clients:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentClients:", error);
    throw error;
  }
};
