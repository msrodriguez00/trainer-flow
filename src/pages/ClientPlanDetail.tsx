
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CalendarClock, ChevronLeft, Activity, ClipboardList } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import { Plan } from "@/types";
import MainLayout from "@/components/client/layout/MainLayout";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import ClientAuthError from "@/components/client/common/ClientAuthError";
import LoadingScreen from "@/components/client/common/LoadingScreen";
import { Badge } from "@/components/ui/badge";

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
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`
            id,
            name,
            order_index,
            scheduled_date
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

        for (const session of (sessionsData || [])) {
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

  const formatScheduledDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    return format(new Date(dateString), "d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  const handleScheduleSession = async (sessionId: string, date: Date) => {
    try {
      console.log(`Scheduling session ${sessionId} for date ${date.toISOString()}`);
      
      // First verify that the session belongs to a plan owned by this client
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('plan_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error("Error verifying session:", sessionError);
        throw sessionError;
      }

      // Verify that the plan belongs to this client
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('client_id')
        .eq('id', sessionData.plan_id)
        .eq('client_id', clientId)
        .single();

      if (planError) {
        console.error("Error verifying plan ownership:", planError);
        throw planError;
      }

      // If verification passed, update the session date
      const { error } = await supabase
        .from('sessions')
        .update({ scheduled_date: date.toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error("Error updating session date:", error);
        throw error;
      }

      await fetchPlanDetails();

      toast({
        title: "Sesión programada",
        description: `La sesión ha sido programada para ${format(date, "PPP", { locale: es })}`,
      });
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast({
        title: "Error",
        description: "No se pudo programar la sesión. Verifica que tengas permisos para modificar este plan.",
        variant: "destructive",
      });
    }
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
                  <div className="space-y-4">
                    {plan.sessions.map((session) => (
                      <Card key={session.id} className="border overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-muted/10">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-lg">{session.name}</h4>
                          </div>
                          
                          <div className="mt-2 md:mt-0 flex items-center">
                            {session.scheduledDate ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                <span>
                                  {format(new Date(session.scheduledDate), "d MMM yyyy", { locale: es })}
                                </span>
                              </Badge>
                            ) : (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <CalendarClock className="h-3 w-3 mr-1" />
                                <span>Sin fecha programada</span>
                              </div>
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-2">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {session.scheduledDate ? "Cambiar fecha" : "Programar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="p-1">
                                  <h5 className="text-sm font-medium mb-2">Selecciona una fecha</h5>
                                  <CalendarComponent
                                    mode="single"
                                    selected={session.scheduledDate ? new Date(session.scheduledDate) : undefined}
                                    onSelect={(date) => date && handleScheduleSession(session.id, date)}
                                    className="pointer-events-auto"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        
                        <Accordion type="single" collapsible>
                          <AccordionItem value={session.id} className="border-0">
                            <AccordionTrigger className="px-4 py-2">
                              <span className="text-sm">Ver detalles de la sesión</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              {session.scheduledDate && (
                                <div className="mb-4 p-3 bg-primary/5 rounded-md">
                                  <p className="text-sm flex items-center font-medium">
                                    <CalendarClock className="h-4 w-4 mr-2 text-primary" />
                                    Fecha programada: {formatScheduledDate(session.scheduledDate)}
                                  </p>
                                </div>
                              )}
                              
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
                        </Accordion>
                      </Card>
                    ))}
                  </div>
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
