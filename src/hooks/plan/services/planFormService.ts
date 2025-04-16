
import { supabase } from "@/integrations/supabase/client";
import { CreateCompletePlanResponse } from "../types/planFormTypes";
import { Session } from "../types";
import { useToast } from "@/hooks/use-toast";

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
      // Fix the type arguments - the first type parameter should be the return type
      const { data, error } = await supabase.rpc<any>('create_complete_plan', {
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

      // Add proper type assertion to handle the JSON response
      return data as CreateCompletePlanResponse;
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
