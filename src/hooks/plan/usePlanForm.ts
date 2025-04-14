
import { useState, useEffect } from "react";
import { Client, Exercise } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanFormService } from "./planFormService";
import { useSessionOperations } from "./useSessionOperations";
import { useExerciseOperations } from "./useExerciseOperations";
import { createInitialSession } from "./sessionUtils";
import { UsePlanFormResult } from "./types";

export function usePlanForm(initialClientId?: string, onSubmit?: (plan: any) => void): UsePlanFormResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchClients, fetchExercises } = usePlanFormService();
  
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [clients, setClients] = useState<Client[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    sessions,
    setSessions,
    addSession,
    removeSession,
    updateSessionName,
    addSeries,
    removeSeries,
    updateSeriesName
  } = useSessionOperations([createInitialSession()]);

  const {
    addExerciseToSeries,
    removeExerciseFromSeries,
    handleExerciseChange,
    handleLevelChange
  } = useExerciseOperations(sessions, setSessions);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
    }
  }, [initialClientId]);

  const loadInitialData = async () => {
    if (!user) return;
    
    try {
      const clientsData = await fetchClients(user.id);
      setClients(clientsData);
      
      const exercisesData = await fetchExercises();
      setExercises(exercisesData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!name || !clientId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    let hasExercises = false;
    for (const session of sessions) {
      for (const series of session.series) {
        if (series.exercises.length > 0 && series.exercises.some(ex => ex.exerciseId)) {
          hasExercises = true;
          break;
        }
      }
      if (hasExercises) break;
    }

    if (!hasExercises) {
      toast({
        title: "Error",
        description: "El plan debe tener al menos un ejercicio.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .insert({
          name,
          client_id: clientId,
          trainer_id: user.id,
          month: month || null
        })
        .select()
        .single();

      if (planError) throw planError;

      for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
        const session = sessions[sessionIndex];
        
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            name: session.name,
            plan_id: planData.id,
            order_index: sessionIndex,
            client_id: clientId
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        for (let seriesIndex = 0; seriesIndex < session.series.length; seriesIndex++) {
          const series = session.series[seriesIndex];
          
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .insert({
              name: series.name,
              session_id: sessionData.id,
              order_index: seriesIndex,
              client_id: clientId
            })
            .select()
            .single();
            
          if (seriesError) throw seriesError;

          const validExercises = series.exercises.filter(ex => ex.exerciseId && ex.level > 0);
          
          if (validExercises.length > 0) {
            const planExercisesData = validExercises.map(ex => ({
              series_id: seriesData.id,
              exercise_id: ex.exerciseId,
              level: ex.level,
              plan_id: planData.id,
              client_id: clientId
            }));

            const { error: exError } = await supabase
              .from("plan_exercises")
              .insert(planExercisesData);

            if (exError) throw exError;
          }
        }
      }

      const allExercises = [];
      sessions.forEach(session => {
        session.series.forEach(series => {
          series.exercises.forEach(ex => {
            if (ex.exerciseId) {
              allExercises.push({
                exerciseId: ex.exerciseId,
                level: ex.level,
                evaluations: []
              });
            }
          });
        });
      });

      if (onSubmit) {
        onSubmit({
          name,
          clientId,
          month,
          exercises: allExercises,
          sessions
        });
      }

      toast({
        title: "Plan creado",
        description: `El plan "${name}" ha sido creado exitosamente.`,
      });

    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el plan.",
        variant: "destructive",
      });
    }
  };

  return {
    name,
    setName,
    clientId,
    setClientId,
    month,
    setMonth,
    clients,
    exercises,
    sessions,
    loading,
    
    addSession,
    removeSession,
    updateSessionName,
    
    addSeries,
    removeSeries,
    updateSeriesName,
    
    addExerciseToSeries,
    removeExerciseFromSeries,
    handleExerciseChange,
    handleLevelChange,
    
    handleSubmit
  };
}
