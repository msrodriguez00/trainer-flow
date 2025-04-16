
import { Session } from "../types";
import { useToast } from "@/hooks/use-toast";

export const usePlanFormValidation = () => {
  const { toast } = useToast();

  const validatePlanForm = (name: string, clientId: string, sessions: Session[]) => {
    if (!name || !clientId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return false;
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
      return false;
    }

    return true;
  };

  const prepareSessionsData = (sessions: Session[]) => {
    return sessions.map(session => ({
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
  };

  return {
    validatePlanForm,
    prepareSessionsData
  };
};
