
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
    
    if (!user) {
      console.error("No user found for plan creation");
      return;
    }
    
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
    
    console.log("Creating plan with data:", {
      name,
      clientId,
      month: month || null,
      trainer_id: user.id,
      sessionCount: sessions.length
    });

    try {
      // Preparar los datos en formato JSON para la función RPC
      const sessionsData = sessions.map(session => ({
        name: session.name,
        series: session.series.map(series => ({
          name: series.name,
          exercises: series.exercises
            .filter(ex => ex.exerciseId && ex.level > 0)
            .map(ex => ({
              exerciseId: ex.exerciseId,
              level: ex.level
            }))
        }))
      }));
      
      console.log("Calling create_complete_plan RPC function with data:", {
        name,
        client_id: clientId,
        trainer_id: user.id,
        month: month || null,
        sessions: sessionsData
      });

      // Llamar a la función RPC para crear el plan completo en una transacción
      const { data: planData, error } = await supabase.rpc('create_complete_plan', {
        p_name: name,
        p_client_id: clientId,
        p_trainer_id: user.id,
        p_month: month || null,
        p_sessions: sessionsData
      });

      if (error) {
        console.error("Error al crear el plan:", error);
        throw error;
      }
      
      console.log("Plan created successfully with RPC:", planData);

      // Preparar los datos para la respuesta
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
          id: planData.id,
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
        description: "No se pudo crear el plan. Revisa la consola para más detalles.",
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
