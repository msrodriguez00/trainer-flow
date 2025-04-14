
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
      console.log(`usePlanDetail - Iniciando programación de sesión ${sessionId} para fecha ${date.toISOString()}`);
      
      if (!clientId) {
        console.error("usePlanDetail - Error: Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }

      // Registramos el estado actual de la sesión antes de actualizar
      const { data: beforeSession, error: beforeError } = await supabase
        .from('sessions')
        .select('scheduled_date, plan_id')
        .eq('id', sessionId)
        .single();
      
      if (beforeError) {
        console.error("usePlanDetail - Error al obtener datos de sesión antes de actualizar:", beforeError);
      } else {
        console.log("usePlanDetail - Estado actual de la sesión antes de actualizar:", beforeSession);
      }

      // Actualizamos la sesión
      console.log(`usePlanDetail - Actualizando sesión ${sessionId} con fecha ${date.toISOString()}`);
      const { data: updateData, error } = await supabase
        .from('sessions')
        .update({ scheduled_date: date.toISOString() })
        .eq('id', sessionId)
        .select();

      if (error) {
        console.error("usePlanDetail - Error actualizando fecha de la sesión:", error);
        toast({
          title: "Error",
          description: `No se pudo programar la sesión: ${error.message}`,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("usePlanDetail - Actualización exitosa de la sesión:", updateData);
      
      // Verificamos que la actualización se realizó correctamente
      const { data: afterSession, error: afterError } = await supabase
        .from('sessions')
        .select('scheduled_date, plan_id')
        .eq('id', sessionId)
        .single();
      
      if (afterError) {
        console.error("usePlanDetail - Error al obtener datos de sesión después de actualizar:", afterError);
      } else {
        console.log("usePlanDetail - Estado de la sesión después de actualizar:", afterSession);
        
        if (afterSession.scheduled_date === date.toISOString()) {
          console.log("usePlanDetail - La fecha se actualizó correctamente en la base de datos");
        } else {
          console.error("usePlanDetail - La fecha en la base de datos no coincide con la solicitada");
          console.log("Fecha esperada:", date.toISOString());
          console.log("Fecha en BD:", afterSession.scheduled_date);
        }
      }

      // Refrescamos los datos del plan para mostrar los cambios
      console.log("usePlanDetail - Refrescando datos del plan");
      await fetchPlanDetails();

      return;
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
