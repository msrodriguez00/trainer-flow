
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan, Session, Series, PlanExercise } from "@/types";

export const fetchDashboardStats = async (userId: string) => {
  console.log("Dashboard service - Fetching stats for user:", userId);
  try {
    // Fetch exercises count
    const { count: exercisesCount, error: exercisesError } = await supabase
      .from("exercises")
      .select('*', { count: 'exact', head: true });
    
    if (exercisesError) {
      console.error("Dashboard service - Error fetching exercises count:", exercisesError);
      throw exercisesError;
    }
    
    // Fetch clients count
    const { count: clientsCount, error: clientsError } = await supabase
      .from("clients")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    if (clientsError) {
      console.error("Dashboard service - Error fetching clients count:", clientsError);
      throw clientsError;
    }
    
    // Fetch plans count
    const { count: plansCount, error: plansError } = await supabase
      .from("plans")
      .select('*', { count: 'exact', head: true })
      .eq("trainer_id", userId);
    
    if (plansError) {
      console.error("Dashboard service - Error fetching plans count:", plansError);
      throw plansError;
    }
    
    console.log("Dashboard service - Stats fetched successfully:", {
      exercises: exercisesCount || 0,
      clients: clientsCount || 0,
      plans: plansCount || 0
    });
    
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
  console.log("Dashboard service - Fetching recent plans for user:", userId);
  
  try {
    // Fetch minimal plan data to avoid timeout
    console.log("Dashboard service - Fetching basic plan data");
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

    if (error) {
      console.error("Dashboard service - Error fetching plans:", error);
      throw error;
    }

    console.log(`Dashboard service - Successfully fetched ${data?.length || 0} recent plans, now fetching details`);

    // We'll create a streamlined approach to fetch plan details
    const formattedPlans: Plan[] = [];
      
    for (const planData of data) {
      console.log(`Dashboard service - Processing plan: ${planData.id} - ${planData.name}`);
      
      try {
        // First, let's get the total count of exercises for this plan using a simpler query
        const { count: exerciseCount, error: countError } = await supabase
          .from("plan_exercises")
          .select('*', { count: 'exact', head: true })
          .eq("plan_id", planData.id);
          
        if (countError) {
          console.error(`Dashboard service - Error counting exercises for plan ${planData.id}:`, countError);
          throw countError;
        }
        
        console.log(`Dashboard service - Plan ${planData.id} has ${exerciseCount || 0} exercises`);
        
        // For the dashboard we don't need full plan details, just a count of exercises
        formattedPlans.push({
          id: planData.id,
          name: planData.name,
          clientId: planData.client_id,
          createdAt: planData.created_at,
          sessions: [], // Minimal data for dashboard display
          exercises: [] // Using an empty array but we know the count
        });
      } catch (planError) {
        console.error(`Dashboard service - Error processing plan ${planData.id}:`, planError);
        // Continue with other plans despite this error
        formattedPlans.push({
          id: planData.id,
          name: planData.name,
          clientId: planData.client_id,
          createdAt: planData.created_at,
          sessions: [],
          exercises: []
        });
      }
    }

    console.log(`Dashboard service - Returning ${formattedPlans.length} recent plans for dashboard`);
    return formattedPlans;
    
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentPlans:", error);
    throw error;
  }
};

export const fetchRecentClients = async (userId: string): Promise<Client[]> => {
  console.log("Dashboard service - Fetching recent clients for user:", userId);
  try {
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

    console.log(`Dashboard service - Successfully fetched ${data?.length || 0} recent clients`);
    return data;
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentClients:", error);
    throw error;
  }
};
