
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, ClipboardList } from "lucide-react";
import { Plan, Client, Session, Series, PlanExercise } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const Plans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchClients();
    }
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    
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
        .eq("trainer_id", user.id)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      const formattedPlans: Plan[] = [];
      
      for (const plan of plansData) {
        // Fetch sessions for this plan
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select(`id, name, order_index`)
          .eq("plan_id", plan.id)
          .order("order_index", { ascending: true });
          
        if (sessionsError) throw sessionsError;
        
        const sessions: Session[] = [];
        
        for (const session of sessionsData || []) {
          // Fetch series for this session
          const { data: seriesData, error: seriesError } = await supabase
            .from("series")
            .select(`id, name, order_index`)
            .eq("session_id", session.id)
            .order("order_index", { ascending: true });
            
          if (seriesError) throw seriesError;
          
          const seriesList: Series[] = [];
          
          for (const series of seriesData || []) {
            // Fetch exercises for this series
            const { data: exercisesData, error: exercisesError } = await supabase
              .from("plan_exercises")
              .select(`
                id, exercise_id, level,
                exercises:exercise_id (name)
              `)
              .eq("series_id", series.id);
              
            if (exercisesError) throw exercisesError;
            
            const exercises: PlanExercise[] = exercisesData.map((ex: any) => ({
              exerciseId: ex.exercise_id,
              exerciseName: ex.exercises?.name,
              level: ex.level,
              evaluations: []
            }));
            
            seriesList.push({
              id: series.id,
              name: series.name,
              orderIndex: series.order_index,
              exercises
            });
          }
          
          sessions.push({
            id: session.id,
            name: session.name,
            orderIndex: session.order_index,
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
          id: plan.id,
          name: plan.name,
          clientId: plan.client_id,
          createdAt: plan.created_at,
          sessions,
          exercises: allExercises
        });
      }
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", user.id);

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const client = clients.find((c) => c.id === plan.clientId);
    return (
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client &&
        client.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleCreatePlan = () => {
    navigate("/plans/new");
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlans(plans.filter((plan) => plan.id !== id));
      toast({
        title: "Plan eliminado",
        description: "Se ha eliminado el plan correctamente",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Planes</h1>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" /> Crear Plan
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Buscar planes por nombre o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p>Cargando planes...</p>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const client = clients.find((c) => c.id === plan.clientId);
              
              return (
                <Card 
                  key={plan.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(plan.id);
                            }}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-3">
                      {client && (
                        <>
                          <img
                            src={client.avatar || "https://i.pravatar.cc/150"}
                            alt={client.name}
                            className="h-8 w-8 rounded-full mr-2"
                          />
                          <span className="text-gray-700">{client.name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        <span>{plan.exercises.length} ejercicios</span>
                      </div>
                      <div>Creado: {formatDate(plan.createdAt)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm
                ? "No se encontraron planes"
                : "No hay planes aún"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm
                ? "Intenta con otra búsqueda"
                : "¡Crea tu primer plan para comenzar!"}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={handleCreatePlan}>
                <Plus className="mr-2 h-4 w-4" /> Crear primer plan
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Plans;
