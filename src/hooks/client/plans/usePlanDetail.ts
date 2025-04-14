
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import { debugUpdateSession } from "@/utils/debugUtils";

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

      if (!planData) {
        setState(prev => ({ ...prev, loading: false, plan: null }));
        return;
      }

      // Fetch sessions with retry logic
      let sessionsData = null;
      let sessionsError = null;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (retryCount < MAX_RETRIES && !sessionsData) {
        try {
          const response = await supabase
            .from("sessions")
            .select(`
              id,
              name,
              order_index,
              scheduled_date
            `)
            .eq("plan_id", planData.id)
            .order("order_index", { ascending: true });
          
          sessionsData = response.data;
          sessionsError = response.error;
          
          if (sessionsError) {
            console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} - Error fetching sessions:`, sessionsError);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        } catch (err) {
          console.error(`Retry ${retryCount + 1}/${MAX_RETRIES} - Exception fetching sessions:`, err);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

      if (sessionsError) {
        console.error("Final error fetching sessions after retries:", sessionsError);
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
        try {
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
            try {
              // Use a timeout to prevent long-running queries
              const fetchExercises = async () => {
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
                  .eq("series_id", serie.id)
                  .timeout(5000); // Set a 5 second timeout

                if (exercisesError) {
                  console.error("Error fetching exercises:", exercisesError);
                  return [];
                }

                return exercisesWithDetails || [];
              };

              const exercisesWithDetails = await fetchExercises();
              
              // Map exercises with safer access patterns
              const mappedExercises = exercisesWithDetails.map(ex => {
                // Safely access evaluations
                const evaluations = Array.isArray(ex.evaluations) 
                  ? ex.evaluations.map(evaluation => ({
                      timeRating: evaluation?.time_rating,
                      weightRating: evaluation?.weight_rating,
                      repetitionsRating: evaluation?.repetitions_rating,
                      exerciseRating: evaluation?.exercise_rating,
                      comment: evaluation?.comment,
                      date: evaluation?.date
                    }))
                  : [];
                
                return {
                  exerciseId: ex.exercise_id,
                  exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
                  level: ex.level || 1,
                  evaluations
                };
              });

              seriesList.push({
                id: serie.id,
                name: serie.name,
                orderIndex: serie.order_index,
                exercises: mappedExercises
              });
            } catch (err) {
              console.error("Error processing series:", err);
            }
          }
          
          sessions.push({
            id: session.id,
            name: session.name,
            orderIndex: session.order_index,
            scheduledDate: session.scheduled_date,
            series: seriesList
          });
        } catch (err) {
          console.error("Error processing session:", err);
        }
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
      console.log(`usePlanDetail - Iniciando programación de sesión ${sessionId} para fecha ${date.toISOString()}`);
      
      if (!clientId) {
        console.error("usePlanDetail - Error: Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }

      // Usar método directo sin verificaciones previas
      const { data, error } = await supabase
        .from('sessions')
        .update({ scheduled_date: date.toISOString() })
        .eq('id', sessionId)
        .select('*');

      if (error) {
        console.error("usePlanDetail - Error actualizando fecha de la sesión:", error);
        
        // Intentar debug para entender el problema
        const debugResult = await debugUpdateSession(sessionId, date);
        console.log("Resultado depuración:", debugResult);
        
        toast({
          title: "Error",
          description: `No se pudo programar la sesión: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("usePlanDetail - Actualización exitosa de la sesión:", data);
      
      // Refrescar los datos para mostrar los cambios
      await fetchPlanDetails();
      
      return true;
    } catch (error) {
      console.error("usePlanDetail - Error general programando sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo programar la sesión. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    plan: state.plan,
    loading: state.loading || clientLoading,
    handleScheduleSession
  };
};
