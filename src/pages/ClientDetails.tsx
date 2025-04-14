
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import ClientInfoCard from "@/components/client/ClientInfoCard";
import ClientPlansList from "@/components/client/ClientPlansList";
import { ArrowLeft, UserPlus, Plus, ListPlus } from "lucide-react";
import { Client, Plan, Session, Series, PlanExercise } from "@/types";

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchClientDetails();
      fetchClientPlans();
    }
  }, [id, user]);

  const fetchClientDetails = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("trainer_id", user.id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientPlans = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at
        `)
        .eq("client_id", id)
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPlans: Plan[] = [];
      
      for (const planData of data) {
        // Fetch sessions for this plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`id, name, order_index`)
          .eq("plan_id", planData.id)
          .order("order_index", { ascending: true });
          
        if (sessionsError) throw sessionsError;
        
        const sessions: Session[] = [];
        
        for (const sessionData of sessionsData) {
          // Fetch series for this session
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select(`id, name, order_index`)
            .eq("session_id", sessionData.id)
            .order("order_index", { ascending: true });
            
          if (seriesError) throw seriesError;
          
          const seriesList: Series[] = [];
          
          for (const seriesItem of seriesData) {
            // Fetch exercises for this series
            const { data: exercisesData, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id, exercise_id, level,
                exercises:exercise_id (name)
              `)
              .eq("series_id", seriesItem.id);
              
            if (exercisesError) throw exercisesError;
            
            const exercises: PlanExercise[] = exercisesData.map((ex: any) => ({
              exerciseId: ex.exercise_id,
              exerciseName: ex.exercises?.name,
              level: ex.level,
              evaluations: []
            }));
            
            seriesList.push({
              id: seriesItem.id,
              name: seriesItem.name,
              orderIndex: seriesItem.order_index,
              exercises
            });
          }
          
          sessions.push({
            id: sessionData.id,
            name: sessionData.name,
            orderIndex: sessionData.order_index,
            series: seriesList
          });
        }
        
        // Flatten exercises for backward compatibility
        const allExercises: PlanExercise[] = [];
        sessions.forEach(session => {
          session.series.forEach(series => {
            allExercises.push(...series.exercises);
          });
        });
        
        formattedPlans.push({
          id: planData.id,
          name: planData.name,
          clientId: planData.client_id,
          createdAt: planData.created_at,
          sessions,
          exercises: allExercises
        });
      }

      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching client plans:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes del cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-500">Cargando información del cliente...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64 flex-col">
            <p className="text-lg text-gray-500 mb-4">Cliente no encontrado</p>
            <Button asChild>
              <Link to="/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a clientes
              </Link>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" asChild className="mr-4">
              <Link to="/clients">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to={`/plans/new?clientId=${client.id}`}>
                <ListPlus className="mr-2 h-4 w-4" />
                Nuevo plan
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client information card */}
          <div className="lg:col-span-1">
            <ClientInfoCard client={client} />
          </div>

          {/* Plans and other tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="plans" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plans">Planes de Entrenamiento</TabsTrigger>
                <TabsTrigger value="progress">Progreso</TabsTrigger>
              </TabsList>
              
              <TabsContent value="plans" className="mt-6">
                <ClientPlansList plans={plans} clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progreso del Cliente</CardTitle>
                    <CardDescription>
                      Seguimiento del progreso del cliente a lo largo del tiempo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Próximamente se implementará el seguimiento de progreso.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDetails;
