
import { useState, useEffect } from "react";
import { Exercise, Client } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ExerciseSelection {
  exerciseId: string;
  level: number;
  sessionId: string;
  seriesId: string;
}

interface Series {
  id: string;
  name: string;
  exercises: ExerciseSelection[];
}

interface Session {
  id: string;
  name: string;
  series: Series[];
}

interface UsePlanFormResult {
  name: string;
  setName: (name: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  clients: Client[];
  exercises: Exercise[];
  sessions: Session[];
  loading: boolean;
  
  addSession: () => void;
  removeSession: (index: number) => void;
  updateSessionName: (index: number, name: string) => void;
  
  addSeries: (sessionIndex: number) => void;
  removeSeries: (sessionIndex: number, seriesIndex: number) => void;
  updateSeriesName: (sessionIndex: number, seriesIndex: number, name: string) => void;
  
  addExerciseToSeries: (sessionIndex: number, seriesIndex: number) => void;
  removeExerciseFromSeries: (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => void;
  handleExerciseChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => void;
  handleLevelChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => void;
  
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function usePlanForm(initialClientId?: string, onSubmit?: (plan: any) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: `temp-session-${Date.now()}`,
      name: "Sesión 1",
      series: [
        {
          id: `temp-series-${Date.now()}`,
          name: "Serie 1",
          exercises: []
        }
      ]
    }
  ]);
  const [clients, setClients] = useState<Client[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchExercises();
    }
  }, [user]);

  // Set initial client ID if provided via props
  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
    }
  }, [initialClientId]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", user.id)
        .order("name");

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    }
  };

  const fetchExercises = async () => {
    if (!user) return;

    try {
      console.log("Fetching exercises...");
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, categories, levels")
        .order("name");

      if (error) throw error;

      console.log("Exercises data received:", data);

      const formattedExercises: Exercise[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories || [],
        levels: Array.isArray(item.levels) ? item.levels : []
      }));

      console.log("Formatted exercises:", formattedExercises);
      setExercises(formattedExercises);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ejercicios.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const addSession = () => {
    setSessions([
      ...sessions,
      {
        id: `temp-session-${Date.now()}`,
        name: `Sesión ${sessions.length + 1}`,
        series: [
          {
            id: `temp-series-${Date.now()}`,
            name: "Serie 1",
            exercises: []
          }
        ]
      }
    ]);
  };

  const removeSession = (index: number) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Error",
        description: "El plan debe tener al menos una sesión.",
        variant: "destructive",
      });
    }
  };

  const updateSessionName = (index: number, name: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[index].name = name;
    setSessions(updatedSessions);
  };

  const addSeries = (sessionIndex: number) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series.push({
      id: `temp-series-${Date.now()}`,
      name: `Serie ${updatedSessions[sessionIndex].series.length + 1}`,
      exercises: []
    });
    setSessions(updatedSessions);
  };

  const removeSeries = (sessionIndex: number, seriesIndex: number) => {
    const updatedSessions = [...sessions];
    if (updatedSessions[sessionIndex].series.length > 1) {
      updatedSessions[sessionIndex].series = updatedSessions[sessionIndex].series.filter(
        (_, i) => i !== seriesIndex
      );
      setSessions(updatedSessions);
    } else {
      toast({
        title: "Error",
        description: "Cada sesión debe tener al menos una serie.",
        variant: "destructive",
      });
    }
  };

  const updateSeriesName = (sessionIndex: number, seriesIndex: number, name: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].name = name;
    setSessions(updatedSessions);
  };

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

    // Verificar que todas las sesiones tengan al menos un ejercicio
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
      // 1. Crear el plan
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .insert({
          name,
          client_id: clientId,
          trainer_id: user.id
        })
        .select()
        .single();

      if (planError) throw planError;

      // 2. Crear sesiones, series y ejercicios
      for (let sessionIndex = 0; sessionIndex < sessions.length; sessionIndex++) {
        const session = sessions[sessionIndex];
        
        // Crear sesión
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            name: session.name,
            plan_id: planData.id,
            order_index: sessionIndex
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        for (let seriesIndex = 0; seriesIndex < session.series.length; seriesIndex++) {
          const series = session.series[seriesIndex];
          
          // Crear serie
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .insert({
              name: series.name,
              session_id: sessionData.id,
              order_index: seriesIndex
            })
            .select()
            .single();
            
          if (seriesError) throw seriesError;

          // Insertar los ejercicios de esta serie
          const validExercises = series.exercises.filter(ex => ex.exerciseId && ex.level > 0);
          
          if (validExercises.length > 0) {
            const planExercisesData = validExercises.map(ex => ({
              series_id: seriesData.id,
              exercise_id: ex.exerciseId,
              level: ex.level,
              plan_id: planData.id  // Necesario para la política RLS
            }));

            const { error: exError } = await supabase
              .from("plan_exercises")
              .insert(planExercisesData);

            if (exError) throw exError;
          }
        }
      }

      // Aplanar todos los ejercicios para mantener compatibilidad con la interfaz anterior
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
