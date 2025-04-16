
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
    
    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc('get_recent_plans_with_clients', {
        p_trainer_id: userId,
        p_limit: 3
      });

      if (error) {
        // Log the error but don't throw - we'll fall back to the manual method
        console.error("Dashboard service - Error with RPC function, using fallback method:", error);
        throw error; // This will be caught by the inner try/catch
      }
      
      // Handle the case where data might not be an array
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log("Dashboard service - No plans found");
        return [];
      }
      
      // Transform the data to match the expected Plan type
      const formattedPlans: Plan[] = data.map((plan: any) => {
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
    } catch (rpcError) {
      // Fallback to direct query if the RPC fails
      console.log("Dashboard service - Using fallback method to fetch recent plans");
      
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, client_id, created_at")
        .eq("trainer_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) {
        console.error("Dashboard service - Error in fallback method:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Transform the data to match the expected Plan type
      const formattedPlans: Plan[] = data.map((plan) => {
        return {
          id: plan.id,
          name: plan.name,
          clientId: plan.client_id,
          createdAt: plan.created_at,
          sessions: [],
          exercises: [] // Empty array for exercises since we don't fetch them for the dashboard
        };
      });
      
      console.log(`Dashboard service - Successfully fetched ${formattedPlans.length} recent plans using fallback`);
      return formattedPlans;
    }
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
