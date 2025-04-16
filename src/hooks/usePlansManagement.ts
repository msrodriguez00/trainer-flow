
import { useState, useEffect } from "react";
import { Plan, Client } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { fetchPlans, fetchClientsForTrainer, deletePlan } from "@/services/planService";

export const usePlansManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("usePlansManagement - User loaded:", !!user);
    if (user) {
      console.log("usePlansManagement - Starting to fetch plans and clients for user:", user.id);
      loadPlansAndClients();
    }
  }, [user]);

  const loadPlansAndClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [plansData, clientsData] = await Promise.all([
        fetchPlans(user.id),
        fetchClientsForTrainer(user.id)
      ]);
      
      setPlans(plansData);
      setClients(clientsData);
    } catch (error) {
      console.error("usePlansManagement - Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await deletePlan(id);
      setPlans(plans.filter((plan) => plan.id !== id));
      toast({
        title: "Plan eliminado",
        description: "Se ha eliminado el plan correctamente",
        variant: "destructive",
      });
    } catch (error) {
      console.error("usePlansManagement - Error deleting plan:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el plan.",
        variant: "destructive",
      });
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

  return {
    searchTerm,
    setSearchTerm,
    plans,
    clients,
    loading,
    filteredPlans,
    handleDeletePlan,
  };
};
