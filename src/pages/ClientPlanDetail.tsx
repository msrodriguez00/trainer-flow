import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types";
import MainLayout from "@/components/client/layout/MainLayout";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronLeft, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import ClientAuthError from "@/components/client/common/ClientAuthError";
import LoadingScreen from "@/components/client/common/LoadingScreen";

const ClientPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();

  useEffect(() => {
    if (id && clientId) {
      fetchPlanDetails();
    } else if (!clientLoading && !clientId) {
      setLoading(false);
    }
  }, [id, clientId, clientLoading]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      console.log("Fetching plan details for ID:", id, "client ID:", clientId);

      // Obtener el plan
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          created_at,
          month
        `)
        .eq("id", id)
        .eq("client_id", clientId)
        .single();

      if (planError) {
        console.error("Error fetching plan:", planError);
        toast({
          title: "Error",
          description: "No se pudo cargar el plan",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (planData) {
        // Obtener las sesiones del plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            name,
            order_index
          `)
          .eq("plan_id", planData.id)
          .order("order_index", { ascending: true });

        if (sessionsError) {
          console.error("Error fetching sessions:", sessionsError);
          toast({
            title: "Error",
            description: "No se pudieron cargar las sesiones del plan",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const sessions = [];

        // Para cada sesión, obtener las series y ejercicios
        for (const session of (sessionsData || [])) {
          // Obtener series
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select(`
              id,
              name,
              order_index
            `)
            .eq("session_id", session.id)
            .order("order_index", { ascending: true });

          if (seriesError) {
            console.error("Error fetching series:", seriesError);
            continue;
          }

          const seriesList = [];

          // Para cada serie, obtener los ejercicios con JOIN a la tabla exercises
          for (const serie of (seriesData || [])) {
            const { data: exercisesWithDetails, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id,
                exercise_id,
                level,
                evaluations (*),
                exercises (
                  id,
                  name
                )
              `)
              .eq("series_id", serie.id);

            if (exercisesError) {
              console.error("Error fetching exercises:", exercisesError);
              continue;
            }

            console.log("Exercise data in plan detail for series", serie.id, ":", exercisesWithDetails);
            
            // Debug para ver cada ejercicio
            exercisesWithDetails?.forEach((ex, idx) => {
              console.log(`Plan detail - Exercise ${idx} data:`, ex);
              console.log(`Plan detail - Exercise ${idx} name:`, ex.exercises?.name || "NO NAME FOUND");
            });

            const mappedExercises = exercisesWithDetails?.map(ex => {
              const mappedEvaluations = ex.evaluations ? ex.evaluations.map((evaluation: any) => ({
                timeRating: evaluation.time_rating,
                weightRating: evaluation.weight_rating,
                repetitionsRating: evaluation.repetitions_rating,
                exerciseRating: evaluation.exercise_rating,
                comment: evaluation.comment,
                date: evaluation.date
              })) : [];
              
              return {
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
                level: ex.level,
                evaluations: mappedEvaluations
              };
            }) || [];

            seriesList.push({
              id: serie.id,
              name: serie.name,
              orderIndex: serie.order_index,
              exercises: mappedExercises
            });
          }
          
          sessions.push({
            id: session.id,
            name: session.name,
            orderIndex: session.order_index,
            series: seriesList
          });
        }
        
        // Aplanar ejercicios para compatibilidad con la estructura existente
        const allExercises = [];
        sessions.forEach(session => {
          session.series.forEach(series => {
            allExercises.push(...series.exercises);
          });
        });

        const fullPlan = {
          id: planData.id,
          name: planData.name,
          clientId: clientId as string,
          createdAt: planData.created_at,
          month: planData.month,
          sessions: sessions,
          exercises: allExercises
        };

        console.log("Plan completo cargado:", fullPlan);
        setPlan(fullPlan);
      }
    } catch (error) {
      console.error("Error en fetchPlanDetails:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar el plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  if (clientLoading || loading) {
    return <LoadingScreen />;
  }

  if (!clientId) {
    return <ClientAuthError message="Necesitas iniciar sesión para ver los detalles del plan" />;
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <Card className="shadow-md">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Plan no encontrado</h3>
                <p className="text-gray-500 mb-6">
                  El plan que buscas no existe o no tienes permiso para verlo
                </p>
                <Button onClick={() => navigate("/client-plans")}>
                  Ver mis planes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Calcular el número total de ejercicios en todo el plan
  const totalExercises = plan?.sessions.reduce((total, session) => {
    return total + session.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.exercises.length;
    }, 0);
  }, 0) || 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/client-plans")} 
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a mis planes
        </Button>
        
        {!loading && !plan && (
          <Card className="shadow-md">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Plan no encontrado</h3>
                <p className="text-gray-500 mb-6">
                  El plan que buscas no existe o no tienes permiso para verlo
                </p>
                <Button onClick={() => navigate("/client-plans")}>
                  Ver mis planes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {plan && (
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="mb-4 md:mb-0">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Creado el {formatDate(plan.createdAt)}</span>
                  </div>
                </div>
                
                {plan.month && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4 mr-2" />
                    {plan.month}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Resumen del plan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sesiones</p>
                    <p className="text-2xl font-semibold">{plan.sessions.length}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Series</p>
                    <p className="text-2xl font-semibold">
                      {plan.sessions.reduce((acc, session) => acc + session.series.length, 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Ejercicios</p>
                    <p className="text-2xl font-semibold">{totalExercises}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Sesiones de Entrenamiento</h3>
                
                {plan.sessions.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {plan.sessions.map((session) => (
                      <AccordionItem key={session.id} value={session.id} className="border rounded-lg">
                        <AccordionTrigger className="px-4 py-3">
                          <div className="font-medium">{session.name}</div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {session.series.map((serie) => (
                            <div key={serie.id} className="mt-4 first:mt-0">
                              <h4 className="font-medium text-primary mb-2">{serie.name}</h4>
                              
                              {serie.exercises.length > 0 ? (
                                <div className="space-y-3">
                                  {serie.exercises.map((exercise, idx) => (
                                    <div key={idx} className="p-3 bg-muted/20 rounded-md">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{exercise.exerciseName}</p>
                                          <p className="text-sm text-muted-foreground">Nivel {exercise.level}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No hay ejercicios en esta serie
                                </p>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-muted-foreground">Este plan no tiene sesiones configuradas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientPlanDetail;
