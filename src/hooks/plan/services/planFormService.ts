
import { supabase } from "@/integrations/supabase/client";
import { CreateCompletePlanResponse } from "../types/planFormTypes";
import { Session } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export const usePlanFormService = () => {
  const { toast } = useToast();

  const fetchClients = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", userId)
        .order("name");

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchExercises = async () => {
    try {
      console.log("Fetching exercises...");
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, categories, levels")
        .order("name");

      if (error) throw error;

      console.log("Exercises data received:", data);

      const formattedExercises = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories || [],
        levels: Array.isArray(item.levels) ? item.levels : []
      }));

      console.log("Formatted exercises:", formattedExercises);
      return formattedExercises;
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ejercicios.",
        variant: "destructive",
      });
      return [];
    }
  };

  const createCompletePlan = async (
    name: string,
    clientId: string,
    trainerId: string, 
    month: string | null,
    sessionsData: any[]
  ): Promise<CreateCompletePlanResponse> => {
    try {
      const { data, error } = await supabase.rpc('create_complete_plan', {
        p_name: name,
        p_client_id: clientId,
        p_trainer_id: trainerId,
        p_month: month || null,
        p_sessions: sessionsData
      });

      if (error) {
        console.error("Error creating plan:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from create_complete_plan");
      }

      // First check that data is an object
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error("Invalid data format returned from create_complete_plan");
      }
      
      // Now we can safely cast and access properties
      const typedData = data as Record<string, Json>;
      
      return {
        id: String(typedData.id || ''),
        name: String(typedData.name || ''),
        clientId: String(typedData.clientId || ''),
        month: typedData.month ? String(typedData.month) : null,
        sessionsCount: Number(typedData.sessionsCount || 0)
      };
    } catch (error) {
      console.error("Error in createCompletePlan:", error);
      throw error;
    }
  };

  return {
    fetchClients,
    fetchExercises,
    createCompletePlan
  };
};
