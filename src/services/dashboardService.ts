
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
      // Fall back to the direct query method
      return fetchRecentPlansDirectly(userId);
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("Dashboard service - No plans found");
      return [];
    }
    
    console.log("Dashboard service - Plans data received:", data);
    
    // Transform the data to match the expected Plan type
    const formattedPlans: Plan[] = data.map((plan: any) => {
      return {
        id: plan.id,
        name: plan.name,
        clientId: plan.clientId,
        createdAt: plan.createdAt,
        clientData: plan.client, // Include client data with avatar
        sessions: [],
        exercises: [] // Empty array for exercises since we don't fetch them for the dashboard
      };
    });
    
    console.log(`Dashboard service - Successfully fetched ${formattedPlans.length} recent plans with client data:`, formattedPlans);
    return formattedPlans;
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentPlans:", error);
    // If any error occurs, try the direct method as fallback
    return fetchRecentPlansDirectly(userId);
  }
};

// Separate function for direct database query as fallback
const fetchRecentPlansDirectly = async (userId: string): Promise<Plan[]> => {
  try {
    console.log("Dashboard service - Using fallback method to fetch recent plans");
    
    // Fetch plans and join with clients to get their data
    const { data, error } = await supabase
      .from("plans")
      .select("*, clients(*)")
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
    
    console.log("Dashboard service - Raw plans data from direct query:", data);
    
    // Transform the data to match the expected Plan type
    const formattedPlans: Plan[] = data.map((plan) => {
      return {
        id: plan.id,
        name: plan.name,
        clientId: plan.client_id,
        createdAt: plan.created_at,
        clientData: plan.clients ? {
          id: plan.clients.id,
          name: plan.clients.name,
          avatar: plan.clients.avatar,
          email: plan.clients.email,
          created_at: plan.clients.created_at
        } : undefined,
        sessions: [],
        exercises: [] // Empty array for exercises since we don't fetch them for the dashboard
      };
    });
    
    console.log(`Dashboard service - Successfully fetched ${formattedPlans.length} recent plans using fallback with client data:`, formattedPlans);
    return formattedPlans;
  } catch (error) {
    console.error("Dashboard service - Error in fallback method:", error);
    return [];
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

    // Formatear los datos y asegurarse de que el avatar sea correcto
    const formattedClients = data?.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      avatar: client.avatar,
      created_at: client.created_at
    })) || [];

    console.log("Dashboard service - Formatted clients with avatars:", formattedClients);
    return formattedClients;
  } catch (error) {
    console.error("Dashboard service - Error in fetchRecentClients:", error);
    throw error;
  }
};
