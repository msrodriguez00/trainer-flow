
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Client, Trainer } from "@/components/admin/types";

export const useClientTrainerManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

  const fetchClientsAndTrainers = async () => {
    console.log("Cargando clientes y entrenadores...");
    setLoadingClients(true);
    
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) {
        console.error("Error al obtener clientes:", clientsError);
        throw clientsError;
      }
      
      console.log("Clientes obtenidos:", clientsData?.length || 0, clientsData);
      setClients(clientsData || []);
      
      const { data: trainersData, error: trainersError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("role", ["trainer", "admin"]);
        
      if (trainersError) {
        console.error("Error al obtener entrenadores:", trainersError);
        throw trainersError;
      }
      
      console.log("Entrenadores obtenidos:", trainersData?.length || 0, trainersData);
      setTrainers(trainersData || []);
    } catch (error) {
      console.error("Error fetching clients and trainers:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de clientes y entrenadores",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleUpdateClientTrainers = async (clientId: string, trainerIds: string[]) => {
    try {
      console.log("Actualizando entrenadores para cliente:", clientId, trainerIds);
      
      const { error } = await supabase
        .from("clients")
        .update({ trainers: trainerIds })
        .eq("id", clientId);

      if (error) {
        console.error("Error actualizando trainers:", error);
        throw error;
      }

      setClients(clients.map(client => 
        client.id === clientId ? { ...client, trainers: trainerIds } : client
      ));

      toast({
        title: "Cliente actualizado",
        description: "Los entrenadores del cliente han sido actualizados exitosamente",
      });
      
      setIsEditingClient(false);
      setCurrentClient(null);
    } catch (error: any) {
      console.error("Error updating client trainers:", error);
      toast({
        title: "Error al actualizar cliente",
        description: error.message || "No se pudieron actualizar los entrenadores del cliente",
        variant: "destructive",
      });
    }
  };

  const openEditClientModal = (client: Client) => {
    console.log("Abriendo modal para editar cliente:", client);
    setCurrentClient(client);
    setIsEditingClient(true);
  };

  return {
    clients,
    trainers,
    loadingClients,
    isEditingClient,
    setIsEditingClient,
    currentClient,
    setCurrentClient,
    fetchClientsAndTrainers,
    handleUpdateClientTrainers,
    openEditClientModal
  };
};
