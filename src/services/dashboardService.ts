
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan } from "@/types";

export const fetchDashboardStats = async (userId: string) => {
  try {
    console.log("Dashboard service - Fetching stats using optimized database function");
    
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_trainer_id: userId
    });
    
    if (error) {
      console.error("Dashboard service - Error fetching stats:", error);
      throw error;
    }
    
    // Cast the data to any to access properties
    const statsData = data as any;
    
    return {
      exercises: statsData.exercises || 0,
      clients: statsData.clients || 0,
      plans: statsData.plans || 0,
    };
  } catch (error) {
    console.error("Dashboard service - Error fetching stats:", error);
    throw error;
  }
};

export const fetchRecentPlans = async (userId: string): Promise<Plan[]> => {
  try {
    console.log("Dashboard service - Fetching recent plans with optimized query");
    
    const { data, error } = await supabase.rpc('get_recent_plans_with_clients', {
      p_trainer_id: userId,
      p_limit: 3
    });

    if (error) {
      console.error("Dashboard service - Error fetching recent plans:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("Dashboard service - No plans found");
      return [];
    }
    
    // Cast data to any to access array methods
    const plansData = data as any[];
    
    // Transform the data to match the expected Plan type
    const formattedPlans: Plan[] = plansData.map((plan: any) => {
      return {
        id: plan.id,
        name: plan.name,
        clientId: plan.clientId,
        createdAt: plan.createdAt,
        sessions: [],
        exercises: [] // Empty array for exercises since we don't fetch them for the dashboard
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
