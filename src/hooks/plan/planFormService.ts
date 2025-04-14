
import { Exercise, Client } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePlanFormService = () => {
  const { toast } = useToast();

  const fetchClients = async (userId: string): Promise<Client[]> => {
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

  const fetchExercises = async (): Promise<Exercise[]> => {
    try {
      console.log("Fetching exercises...");
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, categories, levels")
        .order("name");

      if (error) throw error;

      console.log("Exercises data received:", data);

      const formattedExercises: Exercise[] = data.map((item: any) => ({
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

  return {
    fetchClients,
    fetchExercises
  };
};
