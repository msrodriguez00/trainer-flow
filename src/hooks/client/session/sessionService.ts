
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

    // Fetch series data for this session
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

    // Now for each series, fetch the exercises
    const seriesWithExercises: any[] = [];

    for (const series of seriesData) {
      const { data: exercises, error: exercisesError } = await supabase
        .from("plan_exercises")
        .select(`
          id,
          level,
          exercise_id,
          exercises:exercise_id (
            name,
            levels
          )
        `)
        .eq("series_id", series.id);

      if (exercisesError) {
        console.error("Error fetching exercises for series:", exercisesError);
        continue;
      }

      // Transform exercises to the expected format
      const formattedExercises = exercises.map((ex) => {
        // Get level data for the exercise
        const levelData = ex.exercises.levels[ex.level - 1] || {};
        
        return {
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercises.name,
          id: ex.id,
          level: ex.level,
          evaluations: [],
          videoUrl: levelData.video || "",
          repetitions: levelData.repetitions || 0,
          weight: levelData.weight || 0
        };
      });

      seriesWithExercises.push({
        ...series,
        exercises: formattedExercises
      });
    }

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
    // In a real application, you would save the progress to the database
    // For this simplified version, we just log it
    console.log("Saving progress for session", sessionId);
    console.log("Completed exercises:", completedExercises);
    console.log("Completed series:", completedSeries);
    
    // This would be expanded to actually save to Supabase in a real implementation
    return true;
  } catch (error) {
    console.error("Error saving session progress:", error);
    return false;
  }
};
