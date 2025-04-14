
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";

export const useClientPlanDetail = (planId: string | undefined) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();

  useEffect(() => {
    if (planId && clientId) {
      fetchPlanDetails();
    } else if (!clientLoading && !clientId) {
      setLoading(false);
    }
  }, [planId, clientId, clientLoading]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      console.log("Fetching plan details for ID:", planId, "client ID:", clientId);

      // Obtener el plan
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
        // Obtener las sesiones del plan
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

        // Para cada sesión, obtener las series y ejercicios
        for (const session of (sessionsData || [])) {
          // Obtener series
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

          // Para cada serie, obtener los ejercicios
          for (const serie of (seriesData || [])) {
            // Obtener ejercicios con un JOIN para obtener todos los detalles del ejercicio
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

        // Aplanar ejercicios para compatibilidad con la estructura existente
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
  };

  return {
    plan,
    loading,
    clientId
  };
};
