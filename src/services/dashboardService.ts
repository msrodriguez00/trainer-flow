
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan } from "@/types";

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
    console.log("Dashboard service - Fetching recent plans");
    
    // Step 1: Get basic plan data with limit for dashboard
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
      console.log("Dashboard service - No plans found");
      return [];
    }
    
    // Step 2: Get plan IDs for more efficient queries
    const planIds = planBasicData.map(plan => plan.id);
    
    // Step 3: Get exercise counts for each plan using individual count queries
    // This is more compatible with Supabase's current version than group by
    const exerciseCountMap: Record<string, number> = {};
    
    // Get counts for each plan in parallel
    await Promise.all(planIds.map(async (planId) => {
      const { count, error } = await supabase
        .from("plan_exercises")
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);
        
      if (error) {
        console.error(`Dashboard service - Error fetching exercise count for plan ${planId}:`, error);
        return;
      }
      
      exerciseCountMap[planId] = count || 0;
    }));
    
    // Step 4: Format the plans with minimal data needed for the dashboard
    const formattedPlans: Plan[] = planBasicData.map(plan => {
      return {
        id: plan.id,
        name: plan.name,
        clientId: plan.client_id,
        createdAt: plan.created_at,
        // Include only minimal data necessary for the dashboard view
        sessions: [],
        exercises: new Array(exerciseCountMap[plan.id] || 0).fill({})
      };
    });
    
    console.log(`Dashboard service - Successfully fetched ${formattedPlans.length} recent plans`);
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
