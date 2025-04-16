
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
      // Step 1: Create the plan
      console.log("Step 1: Creating plan record");
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

      if (planError) {
        console.error("Error creating plan record:", planError);
        throw planError;
      }
      
      console.log("Plan created successfully:", planData);

      // Step 2: Create sessions for this plan
      for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
        const session = sessions[sessionIndex];
        console.log(`Step 2.${sessionIndex+1}: Creating session "${session.name}"`);
        
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

        if (sessionError) {
          console.error(`Error creating session "${session.name}":`, sessionError);
          throw sessionError;
        }
        
        console.log(`Session "${session.name}" created successfully:`, sessionData);

        // Step 3: Create series for this session
        for (let seriesIndex = 0; seriesIndex < session.series.length; seriesIndex++) {
          const series = session.series[seriesIndex];
          console.log(`Step 3.${sessionIndex+1}.${seriesIndex+1}: Creating series "${series.name}"`);
          
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
            
          if (seriesError) {
            console.error(`Error creating series "${series.name}":`, seriesError);
            throw seriesError;
          }
          
          console.log(`Series "${series.name}" created successfully:`, seriesData);

          // Step 4: Create exercises for this series
          const validExercises = series.exercises.filter(ex => ex.exerciseId && ex.level > 0);
          console.log(`Found ${validExercises.length} valid exercises for series "${series.name}"`);
          
          if (validExercises.length > 0) {
            const planExercisesData = validExercises.map(ex => ({
              series_id: seriesData.id,
              exercise_id: ex.exerciseId,
              level: ex.level,
              plan_id: planData.id,
              client_id: clientId
            }));
            
            console.log("Exercise data to be inserted:", JSON.stringify(planExercisesData));

            const { error: exError } = await supabase
              .from("plan_exercises")
              .insert(planExercisesData);

            if (exError) {
              console.error(`Error creating exercises for series "${series.name}":`, exError);
              console.error("Request payload:", JSON.stringify(planExercisesData));
              throw exError;
            }
            
            console.log(`Successfully added ${validExercises.length} exercises to series "${series.name}"`);
          }
        }
      }

      // Step 5: Prepare response data
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
      
      console.log(`Plan creation complete with ${allExercises.length} total exercises`);

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
