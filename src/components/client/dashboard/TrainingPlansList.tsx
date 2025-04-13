
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Activity } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plan } from "@/types";

const TrainingPlansList = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

  // Get selected trainer from session storage
  useEffect(() => {
    const trainerId = sessionStorage.getItem('selected_trainer_id');
    if (trainerId) {
      setSelectedTrainerId(trainerId);
    }
  }, []);

  // Fetch plans for the selected trainer
  useEffect(() => {
    if (user && selectedTrainerId) {
      fetchClientPlans(selectedTrainerId);
    } else {
      setLoading(false);
    }
  }, [user, selectedTrainerId]);

  const fetchClientPlans = async (trainerId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at,
          plan_exercises:plan_exercises(*)
        `)
        .eq("client_id", user.id)
        .eq("trainer_id", trainerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPlans: Plan[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        clientId: item.client_id,
        createdAt: item.created_at,
        exercises: item.plan_exercises.map((ex: any) => ({
          exerciseId: ex.exercise_id,
          level: ex.level,
          evaluations: []
        }))
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardList className="mr-2 h-5 w-5" />
          Mis Planes de Entrenamiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-gray-500">Cargando planes...</p>
        ) : plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Sheet key={plan.id}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <div className="flex items-center">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>{plan.name}</span>
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{plan.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <div className="mb-4 text-sm text-gray-500">
                      Creado: {formatDate(plan.createdAt)}
                    </div>
                    <h3 className="text-lg font-medium mb-2">Ejercicios ({plan.exercises.length})</h3>
                    <div className="space-y-2">
                      {plan.exercises.map((exercise, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex items-center">
                            <Activity className="mr-2 h-4 w-4" />
                            <span>Ejercicio {index + 1} (Nivel {exercise.level})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No tienes planes asignados todavía con este entrenador.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingPlansList;
