
import { Session } from "./types";

export const useExerciseOperations = (sessions: Session[], setSessions: (sessions: Session[]) => void) => {
  const addExerciseToSeries = (sessionIndex: number, seriesIndex: number) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].exercises.push({
      exerciseId: "",
      level: 1,
      sessionId: updatedSessions[sessionIndex].id,
      seriesId: updatedSessions[sessionIndex].series[seriesIndex].id
    });
    setSessions(updatedSessions);
  };

  const removeExerciseFromSeries = (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].exercises = 
      updatedSessions[sessionIndex].series[seriesIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSessions(updatedSessions);
  };

  const handleExerciseChange = (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].exercises[exerciseIndex].exerciseId = exerciseId;
    updatedSessions[sessionIndex].series[seriesIndex].exercises[exerciseIndex].level = 1;
    setSessions(updatedSessions);
  };

  const handleLevelChange = (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].exercises[exerciseIndex].level = level;
    setSessions(updatedSessions);
  };

  return {
    addExerciseToSeries,
    removeExerciseFromSeries,
    handleExerciseChange,
    handleLevelChange
  };
};
