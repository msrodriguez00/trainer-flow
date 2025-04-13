
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plan, Exercise, Client, PlanExercise } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, Pencil, Save, UserCircle, Trash2, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/card";
import PlanExerciseCard from "@/components/plan/PlanExerciseCard";

const PlanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    if (user && id) {
      fetchPlanDetails();
    }
  }, [user, id]);

  const fetchPlanDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch plan data
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", id)
        .single();

      if (planError) throw planError;
      
      // Fetch plan exercises
      const { data: planExercisesData, error: planExercisesError } = await supabase
        .from("plan_exercises")
        .select(`
          id,
          exercise_id,
          level,
          evaluations (*)
        `)
        .eq("plan_id", id);

      if (planExercisesError) throw planExercisesError;

      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", planData.client_id)
        .single();

      if (clientError) throw clientError;

      // Fetch exercises data
      const exerciseIds = planExercisesData.map((item: any) => item.exercise_id);
      
      if (exerciseIds.length > 0) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .in("id", exerciseIds);

        if (exercisesError) throw exercisesError;
        setExercises(exercisesData);
      }

      // Format plan exercises
      const formattedExercises: PlanExercise[] = planExercisesData.map((item: any) => ({
        exerciseId: item.exercise_id,
        level: item.level,
        evaluations: item.evaluations.map((eval: any) => ({
          timeRating: eval.time_rating,
          weightRating: eval.weight_rating,
          repetitionsRating: eval.repetitions_rating,
          exerciseRating: eval.exercise_rating,
          comment: eval.comment,
          date: eval.date
        }))
      }));

      // Create the plan object
      const formattedPlan: Plan = {
        id: planData.id,
        name: planData.name,
        clientId: planData.client_id,
        exercises: formattedExercises,
        createdAt: planData.created_at
      };

      setPlan(formattedPlan);
      setClient(clientData);
      setEditedName(planData.name);
    } catch (error) {
      console.error("Error fetching plan details:", error);
      toast.error("Error al cargar el plan");
    } finally {
      setIsLoading(false);
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
        // Delete plan exercises first (foreign key constraints)
        const { error: planExercisesError } = await supabase
          .from("plan_exercises")
          .delete()
          .eq("plan_id", plan.id);

        if (planExercisesError) throw planExercisesError;

        // Then delete the plan
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

  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.find(exercise => exercise.id === id);
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
        {/* Breadcrumb and Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')} className="flex items-center px-0 hover:bg-transparent hover:text-primary">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Volver a Planes</span>
          </Button>
        </div>

        {/* Plan Header */}
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

        {/* Exercises List */}
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
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <h3 className="text-lg font-medium mb-2">No hay ejercicios en este plan</h3>
            <p className="text-gray-600 mb-6">Este plan no tiene ningún ejercicio asignado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanDetails;
