
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plan, Exercise, Client, PlanExercise, Session, Series } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Pencil, Save, UserCircle, Trash2, Loader2, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import PlanExerciseCard from "@/components/plan/PlanExerciseCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PlanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");

  useEffect(() => {
    if (user && id) {
      fetchPlanDetails();
      fetchAllExercises();
    }
  }, [user, id]);

  const fetchPlanDetails = async () => {
    setIsLoading(true);
    try {
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", id)
        .single();

      if (planError) throw planError;
      
      // Obtener sesiones
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .eq("plan_id", id)
        .order("order_index", { ascending: true });
        
      if (sessionsError) throw sessionsError;
      
      const sessions: Session[] = [];
      
      // Para cada sesión, obtener sus series
      for (const session of sessionsData) {
        const { data: seriesData, error: seriesError } = await supabase
          .from("series")
          .select("*")
          .eq("session_id", session.id)
          .order("order_index", { ascending: true });
          
        if (seriesError) throw seriesError;
        
        const seriesList: Series[] = [];
        
        // Para cada serie, obtener sus ejercicios
        for (const series of seriesData) {
          const { data: exercisesData, error: exercisesError } = await supabase
            .from("plan_exercises")
            .select(`
              id,
              exercise_id,
              level,
              evaluations (*)
            `)
            .eq("series_id", series.id);
            
          if (exercisesError) throw exercisesError;
          
          const planExercises: PlanExercise[] = [];
          
          // Para cada ejercicio, obtener su información
          for (const ex of exercisesData) {
            const { data: exerciseData, error: exerciseError } = await supabase
              .from("exercises")
              .select("*")
              .eq("id", ex.exercise_id)
              .single();
              
            if (exerciseError) {
              console.error("Error fetching exercise details:", exerciseError);
              continue;
            }
            
            planExercises.push({
              exerciseId: ex.exercise_id,
              exerciseName: exerciseData.name,
              level: ex.level,
              evaluations: ex.evaluations || []
            });
          }
          
          seriesList.push({
            id: series.id,
            name: series.name,
            orderIndex: series.order_index,
            exercises: planExercises
          });
        }
        
        sessions.push({
          id: session.id,
          name: session.name,
          orderIndex: session.order_index,
          series: seriesList
        });
      }
      
      // Aplanar ejercicios para mantener compatibilidad
      const allExercises: PlanExercise[] = [];
      sessions.forEach(session => {
        session.series.forEach(series => {
          allExercises.push(...series.exercises);
        });
      });

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", planData.client_id)
        .single();

      if (clientError) throw clientError;

      // Recolectar todos los IDs de ejercicios para obtener sus detalles
      const exerciseIds = allExercises.map(ex => ex.exerciseId);
      
      if (exerciseIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .in("id", exerciseIds);

        if (exercisesError) throw exercisesError;
        
        const typedExercises: Exercise[] = exercisesData.map((item: any) => ({
          id: item.id,
          name: item.name,
          categories: item.categories,
          levels: item.levels
        }));
        
        setExercises(typedExercises);
      }

      const formattedPlan: Plan = {
        id: planData.id,
        name: planData.name,
        clientId: planData.client_id,
        exercises: allExercises,
        sessions: sessions,
        createdAt: planData.created_at
      };

      setPlan(formattedPlan);
      setClient(clientData);
      setEditedName(planData.name);
      
      // Si hay sesiones, seleccionar por defecto la primera
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].id);
        
        // Si la sesión seleccionada tiene series, seleccionar por defecto la primera
        if (sessions[0].series.length > 0) {
          setSelectedSeriesId(sessions[0].series[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
      toast.error("Error al cargar el plan");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      
      const typedExercises: Exercise[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories,
        levels: item.levels
      }));
      
      setAvailableExercises(typedExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Error al cargar ejercicios disponibles");
    }
  };

  const handleUpdatePlanName = async () => {
    if (!plan || editedName.trim() === "") return;
    
    try {
      const { error } = await supabase
        .from("plans")
        .update({ name: editedName })
        .eq("id", plan.id);

      if (error) throw error;

      setPlan({ ...plan, name: editedName });
      setIsEditing(false);
      toast.success("Nombre del plan actualizado");
    } catch (error) {
      console.error("Error updating plan name:", error);
      toast.error("Error al actualizar el nombre del plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!plan) return;
    
    if (confirm("¿Estás seguro de que quieres eliminar este plan?")) {
      try {
        const { error: planError } = await supabase
          .from("plans")
          .delete()
          .eq("id", plan.id);

        if (planError) throw planError;

        toast.success("Plan eliminado correctamente");
        navigate("/plans");
      } catch (error) {
        console.error("Error deleting plan:", error);
        toast.error("Error al eliminar el plan");
      }
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId || !selectedSeriesId || !plan) return;
    
    try {
      // Comprobar si el ejercicio ya está en el plan
      const exerciseExists = plan.exercises.some(e => e.exerciseId === selectedExerciseId);
      
      if (exerciseExists) {
        toast.error("Este ejercicio ya está en el plan");
        return;
      }
      
      // Recuperar el plan_id para la serie seleccionada
      const { data: seriesData, error: seriesError } = await supabase
        .from("series")
        .select("session_id")
        .eq("id", selectedSeriesId)
        .single();
        
      if (seriesError) throw seriesError;
      
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("plan_id")
        .eq("id", seriesData.session_id)
        .single();
        
      if (sessionError) throw sessionError;
      
      // Insertar el nuevo ejercicio
      const { error } = await supabase
        .from("plan_exercises")
        .insert({
          series_id: selectedSeriesId,
          exercise_id: selectedExerciseId,
          level: selectedLevel,
          plan_id: sessionData.plan_id // Incluir plan_id para políticas RLS
        });

      if (error) throw error;
      
      fetchPlanDetails();
      setIsAddExerciseDialogOpen(false);
      
      setSelectedExerciseId("");
      setSelectedLevel(1);
      
      toast.success("Ejercicio añadido al plan");
    } catch (error) {
      console.error("Error adding exercise to plan:", error);
      toast.error("Error al añadir ejercicio al plan");
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!plan) return;
    
    if (confirm("¿Estás seguro de que quieres eliminar este ejercicio del plan?")) {
      try {
        // Encontrar en qué serie se encuentra este ejercicio
        let seriesId: string | null = null;
        
        for (const session of plan.sessions) {
          for (const series of session.series) {
            for (const exercise of series.exercises) {
              if (exercise.exerciseId === exerciseId) {
                seriesId = series.id;
                break;
              }
            }
            if (seriesId) break;
          }
          if (seriesId) break;
        }
        
        if (!seriesId) {
          console.error("No se encontró la serie del ejercicio");
          return;
        }
        
        const { data: planExerciseData, error: planExerciseError } = await supabase
          .from("plan_exercises")
          .select("id")
          .eq("series_id", seriesId)
          .eq("exercise_id", exerciseId)
          .single();

        if (planExerciseError) throw planExerciseError;
        
        const { error: evalError } = await supabase
          .from("evaluations")
          .delete()
          .eq("plan_exercise_id", planExerciseData.id);
          
        if (evalError) throw evalError;
        
        const { error } = await supabase
          .from("plan_exercises")
          .delete()
          .eq("series_id", seriesId)
          .eq("exercise_id", exerciseId);

        if (error) throw error;
        
        fetchPlanDetails();
        toast.success("Ejercicio eliminado del plan");
      } catch (error) {
        console.error("Error removing exercise:", error);
        toast.error("Error al eliminar el ejercicio");
      }
    }
  };

  const handleUpdateExerciseLevel = async (exerciseId: string, newLevel: number) => {
    if (!plan) return;
    
    try {
      // Encontrar en qué serie se encuentra este ejercicio
      let seriesId: string | null = null;
      
      for (const session of plan.sessions) {
        for (const series of session.series) {
          for (const exercise of series.exercises) {
            if (exercise.exerciseId === exerciseId) {
              seriesId = series.id;
              break;
            }
          }
          if (seriesId) break;
        }
        if (seriesId) break;
      }
      
      if (!seriesId) {
        console.error("No se encontró la serie del ejercicio");
        return;
      }
      
      const { error } = await supabase
        .from("plan_exercises")
        .update({ level: newLevel })
        .eq("series_id", seriesId)
        .eq("exercise_id", exerciseId);

      if (error) throw error;
      
      const updatedPlan = {...plan};
      const exerciseIndex = updatedPlan.exercises.findIndex(e => e.exerciseId === exerciseId);
      if (exerciseIndex !== -1) {
        updatedPlan.exercises[exerciseIndex].level = newLevel;
      }
      
      // También actualizar en la estructura de sesiones/series
      for (const session of updatedPlan.sessions) {
        for (const series of session.series) {
          const exIndex = series.exercises.findIndex(e => e.exerciseId === exerciseId);
          if (exIndex !== -1) {
            series.exercises[exIndex].level = newLevel;
          }
        }
      }
      
      setPlan(updatedPlan);
      toast.success("Nivel del ejercicio actualizado");
    } catch (error) {
      console.error("Error updating exercise level:", error);
      toast.error("Error al actualizar el nivel del ejercicio");
    }
  };

  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.find(exercise => exercise.id === id);
  };

  const getAvailableLevels = (exerciseId: string): number[] => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.levels || exercise.levels.length === 0) {
      return [1];
    }
    return exercise.levels.map(l => l.level);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Cargando detalles del plan...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!plan || !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4">Plan no encontrado</h2>
            <p className="text-gray-600 mb-6">El plan que estás buscando no existe o no tienes acceso a él.</p>
            <Button asChild>
              <Link to="/plans">Volver a planes</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')} className="flex items-center px-0 hover:bg-transparent hover:text-primary">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Volver a Planes</span>
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div className="flex-grow">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                  <Button size="icon" onClick={handleUpdatePlanName} variant="ghost">
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{plan.name}</h1>
                  <Button size="icon" onClick={() => setIsEditing(true)} variant="ghost">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <UserCircle className="h-4 w-4 mr-1" />
                <span>Cliente: {client.name}</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Button variant="destructive" size="sm" onClick={handleDeletePlan} className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Plan
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">Ejercicios</h2>
          <Button onClick={() => setIsAddExerciseDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir Ejercicio
          </Button>
        </div>

        {plan.exercises.length > 0 ? (
          <div className="space-y-6">
            {plan.exercises.map((planExercise) => {
              const exercise = getExerciseById(planExercise.exerciseId);
              if (!exercise) return null;

              return (
                <PlanExerciseCard 
                  key={planExercise.exerciseId} 
                  exercise={exercise} 
                  planExercise={planExercise}
                  planId={plan.id}
                  onUpdate={fetchPlanDetails}
                  onRemove={() => handleRemoveExercise(planExercise.exerciseId)}
                  onLevelUpdate={(newLevel) => handleUpdateExerciseLevel(planExercise.exerciseId, newLevel)}
                  availableLevels={getAvailableLevels(planExercise.exerciseId)}
                  editable={true}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h3 className="text-lg font-medium mb-2">No hay ejercicios en este plan</h3>
            <p className="text-gray-600 mb-6">Este plan no tiene ningún ejercicio asignado.</p>
            <Button onClick={() => setIsAddExerciseDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Añadir Ejercicio
            </Button>
          </div>
        )}
      </main>

      <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Ejercicio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Selección de sesión */}
            {plan.sessions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Sesión</label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sesión" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Selección de serie */}
            {selectedSessionId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Serie</label>
                <Select 
                  value={selectedSeriesId} 
                  onValueChange={setSelectedSeriesId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar serie" />
                  </SelectTrigger>
                  <SelectContent>
                    {plan.sessions
                      .find(s => s.id === selectedSessionId)
                      ?.series.map(series => (
                        <SelectItem key={series.id} value={series.id}>
                          {series.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Selección de ejercicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ejercicio</label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ejercicio" />
                </SelectTrigger>
                <SelectContent>
                  {availableExercises.map(exercise => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selección de nivel */}
            {selectedExerciseId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nivel</label>
                <Select 
                  value={selectedLevel.toString()} 
                  onValueChange={(value) => setSelectedLevel(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLevels(selectedExerciseId).map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExerciseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddExercise} 
              disabled={!selectedExerciseId || !selectedSeriesId}
            >
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanDetails;
