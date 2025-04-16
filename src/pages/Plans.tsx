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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, MoreHorizontal, ClipboardList, Loader2 } from "lucide-react";
import { Plan, Client } from "@/types";
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

// Constante para el tamaño de la página
const PAGE_SIZE = 10;

const Plans = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlans, setTotalPlans] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchPlanCount();
      fetchPlans();
    }
  }, [user, currentPage]);

  useEffect(() => {
    if (user && searchTerm.length > 0) {
      // Reset to first page when searching
      setCurrentPage(1);
      fetchPlans();
    } else if (user && searchTerm.length === 0) {
      fetchPlans();
    }
  }, [user, searchTerm]);

  const fetchPlanCount = async () => {
    if (!user) return;
    
    try {
      // Get total count of plans for pagination
      const { count, error } = await supabase
        .from("plans")
        .select('id', { count: 'exact', head: true })
        .eq("trainer_id", user.id)
        .ilike("name", `%${searchTerm}%`);
      
      if (error) throw error;
      
      setTotalPlans(count || 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)));
    } catch (error) {
      console.error("Error fetching plan count:", error);
    }
  };

  const fetchPlans = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Fetching plans for page:", currentPage);
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Step 1: Get basic plan info with pagination
      const { data: planData, error: planError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at
        `)
        .eq("trainer_id", user.id)
        .ilike("name", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (planError) throw planError;
      
      if (!planData || planData.length === 0) {
        setPlans([]);
        setLoading(false);
        return;
      }

      // Extract plan IDs for use in subsequent queries
      const planIds = planData.map(plan => plan.id);
      
      // Step 2: Get exercise counts for each plan using individual counts
      const exerciseCountMap: Record<string, number> = {};
      
      // Get counts for each plan
      await Promise.all(planIds.map(async (planId) => {
        const { count, error } = await supabase
          .from("plan_exercises")
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', planId);
          
        if (error) {
          console.error(`Error fetching exercise count for plan ${planId}:`, error);
          return;
        }
        
        exerciseCountMap[planId] = count || 0;
      }));
      
      // Step 3: Map the data to the Plan format
      const formattedPlans: Plan[] = planData.map(plan => {
        return {
          id: plan.id,
          name: plan.name,
          clientId: plan.client_id,
          createdAt: plan.created_at,
          // Provide minimal data for the plans list view
          sessions: [],
          exercises: new Array(exerciseCountMap[plan.id] || 0).fill({})  // Just to get the length right
        };
      });
      
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

  const getExerciseCount = (plan: Plan): number => {
    if (!plan.exercises) return 0;
    if (!Array.isArray(plan.exercises)) return 0;
    return plan.exercises.length;
  };

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

      // Refresh the plans after deleting
      fetchPlanCount();
      fetchPlans();
      
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i > 1 && i < totalPages) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i} 
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
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
            placeholder="Buscar planes por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-10 flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-gray-400" />
            <p className="text-gray-500">Cargando planes...</p>
          </div>
        ) : plans.length > 0 ? (
          <>
            <div className="space-y-4">
              {plans.map((plan) => {
                const client = clients.find((c) => c.id === plan.clientId);
                const exerciseCount = getExerciseCount(plan);
                
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
                          <span>{exerciseCount} ejercicios</span>
                        </div>
                        <div>Creado: {formatDate(plan.createdAt)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {generatePaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-center text-sm text-gray-500 mt-4">
                  Mostrando {Math.min(PAGE_SIZE, plans.length)} de {totalPlans} planes
                </div>
              </div>
            )}
          </>
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
