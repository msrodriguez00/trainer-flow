
import { supabase } from "@/integrations/supabase/client";
import { Client, Plan } from "@/types";

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
        created_at,
        plan_exercises:plan_exercises(*)
      `)
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      clientId: item.client_id,
      createdAt: item.created_at,
      exercises: item.plan_exercises.map((ex: any) => ({
        exerciseId: ex.exercise_id,
        level: ex.level,
        evaluations: []
      }))
    }));
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
