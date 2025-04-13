import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Activity } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const TrainingPlansList = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClientId();
    }
  }, [user]);

  useEffect(() => {
    if (clientId) {
      fetchClientPlans();
    } else if (!loading) {
      setLoading(false);
    }
  }, [clientId]);

  const fetchClientId = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client ID:", error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Client ID found:", data.id);
        setClientId(data.id);
      } else {
        console.log("No client record found for this user");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in fetchClientId:", error);
      setLoading(false);
    }
  };

  const fetchClientPlans = async () => {
    if (!clientId) return;
    
    setLoading(true);
    try {
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (plansError) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes",
          variant: "destructive",
        });
        console.error("Error fetching plans:", plansError);
        setLoading(false);
        return;
      }

      console.log("Plans data:", plansData);

      if (plansData && plansData.length > 0) {
        const formattedPlans: Plan[] = [];
        
        for (const plan of plansData) {
          const { data: planExercises, error: exercisesError } = await supabase
            .from("plan_exercises")
            .select(`
              id,
              exercise_id,
              level
            `)
            .eq("plan_id", plan.id);
            
          if (exercisesError) {
            console.error("Error fetching exercises for plan:", plan.id, exercisesError);
            continue;
          }
          
          const exercisesWithNames = [];
          
          for (const planExercise of (planExercises || [])) {
            const { data: exerciseData, error: exerciseError } = await supabase
              .from("exercises")
              .select("name")
              .eq("id", planExercise.exercise_id)
              .maybeSingle();
              
            if (exerciseError) {
              console.error("Error fetching exercise:", planExercise.exercise_id, exerciseError);
              continue;
            }
            
            exercisesWithNames.push({
              exerciseId: planExercise.exercise_id,
              exerciseName: exerciseData?.name || "Ejercicio sin nombre",
              level: planExercise.level,
              evaluations: []
            });
          }
          
          formattedPlans.push({
            id: plan.id,
            name: plan.name,
            clientId: plan.client_id,
            createdAt: plan.created_at,
            exercises: exercisesWithNames
          });
        }

        setPlans(formattedPlans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("Error in fetchClientPlans:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los planes",
        variant: "destructive",
      });
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
                            <span>
                              {exercise.exerciseName || `Ejercicio ${index + 1}`} (Nivel {exercise.level})
                            </span>
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
          <div className="text-center py-6 px-4">
            <ClipboardList className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500">
              No tienes planes asignados todavía.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Los planes de entrenamiento aparecerán aquí cuando tu entrenador los asigne.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingPlansList;
