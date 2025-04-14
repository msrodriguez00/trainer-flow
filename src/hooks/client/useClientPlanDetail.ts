
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";

export const useClientPlanDetail = (planId: string | undefined) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();

  const fetchPlanDetails = useCallback(async () => {
    if (!planId || !clientId) return;
    
    try {
      setLoading(true);
      console.log("Fetching plan details for ID:", planId, "client ID:", clientId);

      // Get the plan
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          created_at,
          month
        `)
        .eq("id", planId)
        .eq("client_id", clientId)
        .single();

      if (planError) {
        console.error("Error fetching plan:", planError);
        toast({
          title: "Error",
          description: "No se pudo cargar el plan",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (planData) {
        // Get sessions for this plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            name,
            order_index,
            scheduled_date
          `)
          .eq("plan_id", planData.id)
          .order("order_index", { ascending: true });

        if (sessionsError) {
          console.error("Error fetching sessions:", sessionsError);
          toast({
            title: "Error",
            description: "No se pudieron cargar las sesiones del plan",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const sessions = [];

        // For each session, get the series and exercises
        for (const session of (sessionsData || [])) {
          // Get series
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select(`
              id,
              name,
              order_index
            `)
            .eq("session_id", session.id)
            .order("order_index", { ascending: true });

          if (seriesError) {
            console.error("Error fetching series:", seriesError);
            continue;
          }

          const seriesList = [];

          // For each series, get the exercises
          for (const serie of (seriesData || [])) {
            // Get exercises with a JOIN to get all exercise details
            const { data: planExercises, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id,
                exercise_id,
                level,
                exercises:exercise_id (*)
              `)
              .eq("series_id", serie.id);

            if (exercisesError) {
              console.error("Error fetching exercises:", exercisesError);
              continue;
            }
            
            const exercisesWithNames = planExercises?.map(ex => ({
              exerciseId: ex.exercise_id,
              exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
              level: ex.level,
              evaluations: []
            })) || [];

            seriesList.push({
              id: serie.id,
              name: serie.name,
              orderIndex: serie.order_index,
              exercises: exercisesWithNames
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

        // Flatten exercises for compatibility with existing structure
        const allExercises = [];
        sessions.forEach(session => {
          session.series.forEach(series => {
            allExercises.push(...series.exercises);
          });
        });

        const fullPlan = {
          id: planData.id,
          name: planData.name,
          clientId: clientId as string,
          createdAt: planData.created_at,
          month: planData.month,
          sessions: sessions,
          exercises: allExercises
        };

        console.log("Plan completo cargado:", fullPlan);
        setPlan(fullPlan);
      }
    } catch (error) {
      console.error("Error en fetchPlanDetails:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar el plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [planId, clientId, toast]);

  useEffect(() => {
    if (planId && clientId) {
      fetchPlanDetails();
    } else if (!clientLoading && !clientId) {
      setLoading(false);
    }
  }, [planId, clientId, clientLoading, fetchPlanDetails]);

  return {
    plan,
    loading,
    clientId,
    refreshPlanDetails: fetchPlanDetails
  };
};
