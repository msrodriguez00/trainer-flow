
import { useState, useEffect } from "react";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import { supabase } from "@/integrations/supabase/client";

export const usePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clientId, loading: clientLoading } = useClientIdentification();

  useEffect(() => {
    if (clientId) {
      fetchClientPlans();
    }
  }, [clientId]);

  const fetchClientPlans = async () => {
    try {
      setLoading(true);

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("id, name, month, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      const formattedPlans = [];

      // Process each plan
      for (const plan of plansData || []) {
        // Fetch sessions for this plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            name,
            order_index,
            scheduled_date
          `)
          .eq("plan_id", plan.id)
          .order("order_index", { ascending: true });

        if (sessionsError) throw sessionsError;

        const sessions = [];

        for (const session of sessionsData || []) {
          // Fetch series for this session
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select(`
              id,
              name,
              order_index
            `)
            .eq("session_id", session.id)
            .order("order_index", { ascending: true });

          if (seriesError) throw seriesError;

          const seriesList = [];

          for (const serie of seriesData || []) {
            // Fetch exercises for this series
            const { data: exercisesData, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id,
                exercise_id,
                level,
                exercises:exercise_id (name)
              `)
              .eq("series_id", serie.id);

            if (exercisesError) throw exercisesError;

            // Map exercises
            const exercises = exercisesData.map(exercise => ({
              exerciseId: exercise.exercise_id,
              exerciseName: exercise.exercises?.name || "Ejercicio sin nombre",
              level: exercise.level
            }));

            seriesList.push({
              id: serie.id,
              name: serie.name,
              orderIndex: serie.order_index,
              exercises
            });
          }

          sessions.push({
            id: session.id,
            name: session.name,
            orderIndex: session.order_index,
            scheduledDate: session.scheduled_date,
            series: seriesList
          });
        }

        // Flatten exercises for backward compatibility
        const allExercises = [];
        sessions.forEach(session => {
          session.series.forEach(series => {
            allExercises.push(...series.exercises);
          });
        });

        formattedPlans.push({
          id: plan.id,
          name: plan.name,
          clientId,
          createdAt: plan.created_at,
          month: plan.month,
          sessions,
          exercises: allExercises
        });
      }

      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching client plans:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    plans,
    loading: loading || clientLoading,
    refetch: fetchClientPlans
  };
};

export default usePlans;
