
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlanFormService } from "./services/planFormService";
import { useSessionOperations } from "./useSessionOperations";
import { useExerciseOperations } from "./useExerciseOperations";
import { createInitialSession } from "./sessionUtils";
import { UsePlanFormResult } from "./types";
import { usePlanFormValidation } from "./utils/planFormValidation";
import { CreateCompletePlanResponse, PlanFormSubmitResult } from "./types/planFormTypes";

export function usePlanForm(initialClientId?: string, onSubmit?: (plan: PlanFormSubmitResult) => void): UsePlanFormResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchClients, fetchExercises, createCompletePlan } = usePlanFormService();
  const { validatePlanForm, prepareSessionsData } = usePlanFormValidation();
  
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [clients, setClients] = useState([]);
  const [exercises, setExercises] = useState([]);
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
    
    if (!validatePlanForm(name, clientId, sessions)) {
      return;
    }

    try {
      // Prepare the data in JSON format for the RPC function
      const sessionsData = prepareSessionsData(sessions);
      
      console.log("Calling create_complete_plan RPC function with data:", {
        name,
        client_id: clientId,
        trainer_id: user.id,
        month: month || null,
        sessions: sessionsData
      });

      // Call the RPC function to create the complete plan in a transaction
      const planData = await createCompletePlan(
        name, 
        clientId, 
        user.id, 
        month || null,
        sessionsData
      );

      console.log("Plan created successfully with RPC:", planData);

      // Prepare data for the response
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
