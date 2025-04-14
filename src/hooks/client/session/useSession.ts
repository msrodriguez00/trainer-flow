
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchSessionData, saveSessionProgress } from "./sessionService";
import { 
  UseSessionResponse, 
  SessionState, 
  TrainingExercise, 
  TrainingSeries 
} from "./types";

export const useSession = (sessionId: string): UseSessionResponse => {
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionId: "",
    sessionName: "",
    series: [],
    progress: {
      currentSeriesIndex: 0,
      currentExerciseIndex: 0,
      completedExercises: [],
      completedSeries: []
    },
    loading: true,
    error: null
  });
  
  // Calculate active series and exercise
  const activeSeries: TrainingSeries | null = sessionState.series.length > 0 
    ? sessionState.series[sessionState.progress.currentSeriesIndex] 
    : null;
    
  const activeExercise: TrainingExercise | null = activeSeries?.exercises.length > 0 
    ? activeSeries.exercises[sessionState.progress.currentExerciseIndex] 
    : null;

  // Calculate if we're on the last exercise/series
  const isLastExercise = activeSeries 
    ? sessionState.progress.currentExerciseIndex === activeSeries.exercises.length - 1 
    : false;
    
  const isLastSeries = sessionState.progress.currentSeriesIndex === sessionState.series.length - 1;

  // Calculate overall progress percentage
  const calculateProgress = useCallback(() => {
    const totalExercises = sessionState.series.reduce(
      (sum, series) => sum + series.exercises.length, 0
    );
    
    if (totalExercises === 0) return 0;
    
    const completedCount = sessionState.progress.completedExercises.length;
    return Math.round((completedCount / totalExercises) * 100);
  }, [sessionState.series, sessionState.progress.completedExercises]);

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setSessionState(prev => ({ ...prev, loading: true }));
        
        const data = await fetchSessionData(sessionId);
        
        if (!data) {
          setSessionState(prev => ({
            ...prev,
            loading: false,
            error: "No se encontró la sesión"
          }));
          return;
        }
        
        // Transform to training series with completed flags
        const trainingSeries = data.series.map(series => ({
          ...series,
          isCompleted: false,
          exercises: series.exercises.map(ex => ({
            ...ex,
            isCompleted: false
          }))
        }));
        
        setSessionState({
          sessionId: data.id,
          sessionName: data.name,
          series: trainingSeries,
          progress: {
            currentSeriesIndex: 0,
            currentExerciseIndex: 0,
            completedExercises: [],
            completedSeries: []
          },
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error loading session:", error);
        setSessionState(prev => ({
          ...prev,
          loading: false,
          error: "Error al cargar la sesión"
        }));
      }
    };
    
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  // Mark current exercise as complete
  const completeExercise = async () => {
    if (!activeExercise) return;

    try {
      // Make a copy of the current state
      const updatedSeries = [...sessionState.series];
      const currentSeriesIndex = sessionState.progress.currentSeriesIndex;
      const currentExerciseIndex = sessionState.progress.currentExerciseIndex;
      
      // Mark the current exercise as completed
      updatedSeries[currentSeriesIndex].exercises[currentExerciseIndex].isCompleted = true;
      
      // Update completed exercises list
      const updatedCompletedExercises = [...sessionState.progress.completedExercises];
      if (!updatedCompletedExercises.includes(activeExercise.id)) {
        updatedCompletedExercises.push(activeExercise.id);
      }
      
      // Update session state
      setSessionState(prev => ({
        ...prev,
        series: updatedSeries,
        progress: {
          ...prev.progress,
          completedExercises: updatedCompletedExercises
        }
      }));
      
      // Automatically move to next exercise if there is one
      if (!isLastExercise) {
        nextExercise();
      } else if (!isLastSeries) {
        // Complete the series and move to the next one
        await completeSeries();
      }
      
      // Save progress to the server
      await saveSessionProgress(
        sessionId, 
        updatedCompletedExercises, 
        sessionState.progress.completedSeries
      );
      
    } catch (error) {
      console.error("Error completing exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar el ejercicio como completado",
        variant: "destructive"
      });
    }
  };

  // Mark current series as complete
  const completeSeries = async () => {
    if (!activeSeries) return;
    
    try {
      // Make a copy of the current state
      const updatedSeries = [...sessionState.series];
      const currentSeriesIndex = sessionState.progress.currentSeriesIndex;
      
      // Mark the current series as completed
      updatedSeries[currentSeriesIndex].isCompleted = true;
      
      // Update completed series list
      const updatedCompletedSeries = [...sessionState.progress.completedSeries];
      if (!updatedCompletedSeries.includes(activeSeries.id)) {
        updatedCompletedSeries.push(activeSeries.id);
      }
      
      // Update session state
      setSessionState(prev => ({
        ...prev,
        series: updatedSeries,
        progress: {
          ...prev.progress,
          completedSeries: updatedCompletedSeries,
          currentExerciseIndex: 0, // Reset exercise index for the next series
          currentSeriesIndex: isLastSeries ? currentSeriesIndex : currentSeriesIndex + 1
        }
      }));
      
      // Save progress to the server
      await saveSessionProgress(
        sessionId, 
        sessionState.progress.completedExercises, 
        updatedCompletedSeries
      );
      
      // Show toast for series completion
      toast({
        title: "Serie completada",
        description: isLastSeries ? "¡Has completado todas las series!" : "Avanzando a la siguiente serie",
        variant: "default" // Changed from "success" to "default"
      });
      
    } catch (error) {
      console.error("Error completing series:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar la serie como completada",
        variant: "destructive"
      });
    }
  };

  // Skip to the next exercise without marking as complete
  const skipExercise = () => {
    if (!activeSeries) return;
    
    if (!isLastExercise) {
      // Go to next exercise in current series
      setSessionState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentExerciseIndex: prev.progress.currentExerciseIndex + 1
        }
      }));
    } else if (!isLastSeries) {
      // Go to first exercise in next series
      setSessionState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentSeriesIndex: prev.progress.currentSeriesIndex + 1,
          currentExerciseIndex: 0
        }
      }));
    }
  };

  // Go to next exercise
  const nextExercise = () => {
    if (!activeSeries) return;
    skipExercise();
  };

  // Go to previous exercise
  const previousExercise = () => {
    if (!activeSeries) return;
    
    if (sessionState.progress.currentExerciseIndex > 0) {
      // Go to previous exercise in current series
      setSessionState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentExerciseIndex: prev.progress.currentExerciseIndex - 1
        }
      }));
    } else if (sessionState.progress.currentSeriesIndex > 0) {
      // Go to last exercise in previous series
      const prevSeriesIndex = sessionState.progress.currentSeriesIndex - 1;
      const prevSeriesLastExerciseIndex = sessionState.series[prevSeriesIndex].exercises.length - 1;
      
      setSessionState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          currentSeriesIndex: prevSeriesIndex,
          currentExerciseIndex: prevSeriesLastExerciseIndex
        }
      }));
    }
  };

  return {
    sessionState,
    activeExercise,
    activeSeries,
    isLastExercise,
    isLastSeries,
    progress: calculateProgress(),
    completeExercise,
    skipExercise,
    nextExercise,
    previousExercise,
    completeSeries
  };
};

export default useSession;
