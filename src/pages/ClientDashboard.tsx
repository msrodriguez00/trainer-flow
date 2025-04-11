
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plan } from "@/types";
import { ClipboardList, Calendar as CalendarIcon, Activity } from "lucide-react";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isClient } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Redirigir a los entrenadores a la página principal
  useEffect(() => {
    if (!isLoading && !isClient) {
      navigate("/");
    }
  }, [isLoading, isClient, navigate]);

  useEffect(() => {
    if (user) {
      fetchClientPlans();
    }
  }, [user]);

  const fetchClientPlans = async () => {
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sección de bienvenida y perfil */}
          <Card className="col-span-full mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">¡Bienvenido, {profile?.name || "Cliente"}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Aquí puedes ver tus planes de entrenamiento y tu calendario de actividades.
              </p>
            </CardContent>
          </Card>
          
          {/* Sección de Calendario */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Calendario de Actividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              
              {selectedDate && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium mb-2">
                    {selectedDate.toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-sm text-gray-600">
                    No hay actividades programadas para este día.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Sección de Planes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                Mis Planes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Cargando planes...</p>
              ) : plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <Sheet key={plan.id}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
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
                  No tienes planes asignados todavía.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
