
import { useState, useEffect } from "react";
import { Exercise } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useExercises = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

  const fetchExercises = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select(`
          id,
          name,
          categories,
          levels
        `)
        .order("name");

      if (error) throw error;

      const formattedExercises: Exercise[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories,
        levels: item.levels.map((level: any) => ({
          level: level.level,
          video: level.video,
          repetitions: level.repetitions,
          weight: level.weight
        }))
      }));

      setExercises(formattedExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ejercicios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async (exercise: Omit<Exercise, "id">) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          name: exercise.name,
          categories: exercise.categories,
          created_by: user.id,
          levels: exercise.levels?.map((level, idx) => ({
            level: idx + 1,
            video: level.video,
            repetitions: level.repetitions,
            weight: level.weight
          }))
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ejercicio creado",
        description: `Se ha añadido "${exercise.name}" a tus ejercicios.`,
      });
      
      fetchExercises(); // Refresh the list
      return true;
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el ejercicio.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdateExercise = async (id: string, updatedExercise: Omit<Exercise, "id">) => {
    if (!user) return false;
    
    try {
      console.log("Updating exercise:", id, updatedExercise);
      
      const { error } = await supabase
        .from("exercises")
        .update({
          name: updatedExercise.name,
          categories: updatedExercise.categories,
          levels: updatedExercise.levels?.map((level, idx) => ({
            level: idx + 1,
            video: level.video,
            repetitions: level.repetitions,
            weight: level.weight
          }))
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Ejercicio actualizado",
        description: `Se ha actualizado "${updatedExercise.name}" correctamente.`,
      });
      
      fetchExercises(); // Refresh the list
      return true;
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ejercicio.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setExercises(exercises.filter((ex) => ex.id !== id));
      toast({
        title: "Ejercicio eliminado",
        description: "Se ha eliminado el ejercicio correctamente.",
        variant: "destructive",
      });
      return true;
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ejercicio.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    exercises,
    loading,
    createExercise: handleCreateExercise,
    updateExercise: handleUpdateExercise,
    deleteExercise: handleDeleteExercise,
    refreshExercises: fetchExercises
  };
};
