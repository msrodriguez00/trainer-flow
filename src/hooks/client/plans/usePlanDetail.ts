
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";

export interface PlanDetailState {
  plan: Plan | null;
  loading: boolean;
}

export const usePlanDetail = (planId: string | undefined) => {
  const [state, setState] = useState<PlanDetailState>({
    plan: null,
    loading: true,
  });
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();

  useEffect(() => {
    if (planId && clientId) {
      fetchPlanDetails();
    } else if (!clientLoading && !clientId) {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [planId, clientId, clientLoading]);

  const fetchPlanDetails = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      console.log("Fetching plan details for ID:", planId, "client ID:", clientId);

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
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (planData) {
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
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const sessions = [];

        for (const session of (sessionsData || [])) {
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

          for (const serie of (seriesData || [])) {
            const { data: exercisesWithDetails, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id,
                exercise_id,
                level,
                evaluations (*),
                exercises (
                  id,
                  name
                )
              `)
              .eq("series_id", serie.id);

            if (exercisesError) {
              console.error("Error fetching exercises:", exercisesError);
              continue;
            }

            console.log("Exercise data in plan detail for series", serie.id, ":", exercisesWithDetails);
            
            exercisesWithDetails?.forEach((ex, idx) => {
              console.log(`Plan detail - Exercise ${idx} data:`, ex);
              console.log(`Plan detail - Exercise ${idx} name:`, ex.exercises?.name || "NO NAME FOUND");
            });

            const mappedExercises = exercisesWithDetails?.map(ex => {
              const mappedEvaluations = ex.evaluations ? ex.evaluations.map((evaluation: any) => ({
                timeRating: evaluation.time_rating,
                weightRating: evaluation.weight_rating,
                repetitionsRating: evaluation.repetitions_rating,
                exerciseRating: evaluation.exercise_rating,
                comment: evaluation.comment,
                date: evaluation.date
              })) : [];
              
              return {
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
                level: ex.level,
                evaluations: mappedEvaluations
              };
            }) || [];

            seriesList.push({
              id: serie.id,
              name: serie.name,
              orderIndex: serie.order_index,
              exercises: mappedExercises
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
        setState({
          plan: fullPlan,
          loading: false
        });
      } else {
        setState({
          plan: null,
          loading: false
        });
      }
    } catch (error) {
      console.error("Error en fetchPlanDetails:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar el plan",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleScheduleSession = async (sessionId: string, date: Date) => {
    try {
      console.log(`Scheduling session ${sessionId} for date ${date.toISOString()}`);
      
      // First verify that the session belongs to a plan owned by this client
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('plan_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error("Error verifying session:", sessionError);
        throw sessionError;
      }

      // Verify that the plan belongs to this client
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('client_id')
        .eq('id', sessionData.plan_id)
        .eq('client_id', clientId)
        .single();

      if (planError) {
        console.error("Error verifying plan ownership:", planError);
        throw planError;
      }

      // If verification passed, update the session date
      const { error } = await supabase
        .from('sessions')
        .update({ scheduled_date: date.toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error("Error updating session date:", error);
        throw error;
      }

      await fetchPlanDetails();

      toast({
        title: "Sesión programada",
        description: `La sesión ha sido programada para ${date.toLocaleDateString('es')}`,
      });
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast({
        title: "Error",
        description: "No se pudo programar la sesión. Verifica que tengas permisos para modificar este plan.",
        variant: "destructive",
      });
    }
  };

  return {
    plan: state.plan,
    loading: state.loading || clientLoading,
    handleScheduleSession
  };
};
