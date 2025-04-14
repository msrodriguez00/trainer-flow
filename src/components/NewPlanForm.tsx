
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Exercise, Client, PlanExercise } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus, Layers, FolderKanban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface NewPlanFormProps {
  initialClientId?: string;
  onSubmit: (plan: {
    name: string;
    clientId: string;
    exercises: PlanExercise[];
    sessions?: any[];
  }) => void;
}

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

const NewPlanForm = ({ initialClientId, onSubmit }: NewPlanFormProps) => {
  const navigate = useNavigate();
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
      const allExercises: PlanExercise[] = [];
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

      onSubmit({
        name,
        clientId,
        exercises: allExercises,
        sessions
      });

      toast({
        title: "Plan creado",
        description: `El plan "${name}" ha sido creado exitosamente.`,
      });

      navigate(-1);

    } catch (error) {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el plan.",
        variant: "destructive",
      });
    }
  };

  const getAvailableLevels = (exerciseId: string): number[] => {
    if (!exerciseId) return [1];
    
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    
    if (!exercise || !exercise.levels || exercise.levels.length === 0) {
      return [1];
    }
    
    return exercise.levels.map((l) => l.level);
  };

  if (loading) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Plan</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Plan</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plan de Fuerza Básico"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Sesiones y Ejercicios</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSession}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir sesión
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={['session-0']} className="space-y-4">
            {sessions.map((session, sessionIndex) => (
              <AccordionItem 
                key={session.id} 
                value={`session-${sessionIndex}`}
                className="border rounded-md overflow-hidden"
              >
                <div className="flex items-center p-2 bg-gray-50">
                  <AccordionTrigger className="flex-1">
                    <div className="flex items-center">
                      <FolderKanban className="h-5 w-5 mr-2" />
                      {session.name}
                    </div>
                  </AccordionTrigger>
                  <div className="flex gap-2 mr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSession(sessionIndex);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <AccordionContent className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`session-name-${sessionIndex}`}>Nombre de la sesión</Label>
                      <Input
                        id={`session-name-${sessionIndex}`}
                        value={session.name}
                        onChange={(e) => updateSessionName(sessionIndex, e.target.value)}
                        placeholder="Nombre de la sesión"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center mt-4 mb-2">
                      <h3 className="text-base font-medium">Series</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSeries(sessionIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir serie
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {session.series.map((series, seriesIndex) => (
                        <Card key={series.id} className="overflow-hidden">
                          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-gray-50">
                            <div className="flex items-center">
                              <Layers className="h-5 w-5 mr-2" />
                              <Input
                                value={series.name}
                                onChange={(e) => updateSeriesName(sessionIndex, seriesIndex, e.target.value)}
                                className="h-8 w-52"
                                placeholder="Nombre de la serie"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSeries(sessionIndex, seriesIndex)}
                                className="h-8 w-8 p-0"
                                disabled={session.series.length === 1}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {series.exercises.map((exercise, exerciseIndex) => (
                                <Card key={`${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
                                  <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                                      <div className="flex-grow space-y-2">
                                        <Label htmlFor={`exercise-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>Ejercicio</Label>
                                        <Select
                                          value={exercise.exerciseId}
                                          onValueChange={(value) => handleExerciseChange(sessionIndex, seriesIndex, exerciseIndex, value)}
                                          required
                                        >
                                          <SelectTrigger id={`exercise-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
                                            <SelectValue placeholder="Seleccionar ejercicio" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {exercises.map((ex) => (
                                              <SelectItem key={ex.id} value={ex.id}>
                                                {ex.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {exercise.exerciseId && (
                                        <div className="w-24 space-y-2">
                                          <Label htmlFor={`level-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>Nivel</Label>
                                          <Select
                                            value={exercise.level.toString()}
                                            onValueChange={(value) =>
                                              handleLevelChange(sessionIndex, seriesIndex, exerciseIndex, parseInt(value))
                                            }
                                            required
                                          >
                                            <SelectTrigger id={`level-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
                                              <SelectValue placeholder="Nivel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getAvailableLevels(exercise.exerciseId).map(
                                                (level) => (
                                                  <SelectItem key={level} value={level.toString()}>
                                                    {level}
                                                  </SelectItem>
                                                )
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => removeExerciseFromSeries(sessionIndex, seriesIndex, exerciseIndex)}
                                      >
                                        <Trash className="h-5 w-5 text-red-500" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addExerciseToSeries(sessionIndex, seriesIndex)}
                                className="w-full mt-2"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Añadir ejercicio a esta serie
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit">Crear Plan</Button>
        </div>
      </form>
    </div>
  );
};

export default NewPlanForm;
