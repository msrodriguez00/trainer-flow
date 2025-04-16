
import { supabase } from "@/integrations/supabase/client";
import { SessionData } from "./types";

export const fetchSessionData = async (sessionId: string): Promise<SessionData | null> => {
  try {
    // Fetch the session data
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("id, name")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      throw new Error(sessionError.message);
    }

    if (!sessionData) {
      return null;
    }

    // Fetch all series data for this session in a single query
    const { data: seriesData, error: seriesError } = await supabase
      .from("series")
      .select(`
        id,
        name,
        order_index
      `)
      .eq("session_id", sessionId)
      .order("order_index");

    if (seriesError) {
      console.error("Error fetching series:", seriesError);
      throw new Error(seriesError.message);
    }

    // Extract all series IDs for the next query
    const seriesIds = seriesData.map(series => series.id);
    
    // Fetch ALL exercises for ALL series in a single query
    const { data: allExercises, error: exercisesError } = await supabase
      .from("plan_exercises")
      .select(`
        id,
        level,
        exercise_id,
        series_id,
        exercises:exercise_id (
          name,
          levels
        )
      `)
      .in("series_id", seriesIds);

    if (exercisesError) {
      console.error("Error fetching exercises:", exercisesError);
      throw new Error(exercisesError.message);
    }

    // Now organize exercises by series
    const seriesWithExercises = seriesData.map(series => {
      // Filter exercises that belong to this series
      const seriesExercises = allExercises.filter(ex => ex.series_id === series.id);
      
      // Transform exercises to the expected format
      const formattedExercises = seriesExercises.map(ex => {
        // Get level data for the exercise
        const levelData = ex.exercises.levels[ex.level - 1] || {};
        
        return {
          id: ex.id,
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercises.name,
          level: ex.level,
          evaluations: [],
          videoUrl: levelData.video || "",
          repetitions: levelData.repetitions || 0,
          weight: levelData.weight || 0
        };
      });

      return {
        id: series.id,
        name: series.name,
        orderIndex: series.order_index, // Convertir order_index a orderIndex para que coincida con el tipo Series
        exercises: formattedExercises
      };
    });

    return {
      id: sessionData.id,
      name: sessionData.name,
      series: seriesWithExercises,
    };
  } catch (error) {
    console.error("Error in fetchSessionData:", error);
    return null;
  }
};

export const saveSessionProgress = async (
  sessionId: string, 
  completedExercises: string[],
  completedSeries: string[]
): Promise<boolean> => {
  try {
    // En una aplicación real, guardarías el progreso en la base de datos
    // Para esta versión simplificada, solo lo registramos en consola
    console.log("Saving progress for session", sessionId);
    console.log("Completed exercises:", completedExercises);
    console.log("Completed series:", completedSeries);
    
    // Esto se expandiría para guardar realmente en Supabase en una implementación real
    return true;
  } catch (error) {
    console.error("Error saving session progress:", error);
    return false;
  }
};
