
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
      // First get the clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, email, current_trainer_id");

      if (clientsError) {
        console.error("Error al obtener clientes:", clientsError);
        throw clientsError;
      }
      
      console.log("Clientes base obtenidos:", clientsData?.length || 0);
      
      // Now get the client-trainer relationships - this is our source of truth
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from("client_trainer_relationships")
        .select("client_id, trainer_id, is_primary");
        
      if (relationshipsError) {
        console.error("Error al obtener relaciones cliente-entrenador:", relationshipsError);
        throw relationshipsError;
      }
      
      console.log("Relaciones cliente-entrenador obtenidas:", relationshipsData?.length || 0);
      
      // Group relationships by client
      const clientRelationships: Record<string, string[]> = {};
      relationshipsData?.forEach(rel => {
        if (!clientRelationships[rel.client_id]) {
          clientRelationships[rel.client_id] = [];
        }
        clientRelationships[rel.client_id].push(rel.trainer_id);
      });
      
      // Merge client data with relationships
      const clientsWithTrainers = clientsData?.map(client => ({
        ...client,
        trainers: clientRelationships[client.id] || []
      }));
      
      setClients(clientsWithTrainers || []);
      console.log("Clientes procesados con relaciones:", clientsWithTrainers);
      
      // Get trainers
      const { data: trainersData, error: trainersError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("role", ["trainer", "admin"]);
        
      if (trainersError) {
        console.error("Error al obtener entrenadores:", trainersError);
        throw trainersError;
      }
      
      console.log("Entrenadores obtenidos:", trainersData?.length || 0);
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
      
      // First, get existing relationships for this client
      const { data: existingRelationships, error: fetchError } = await supabase
        .from("client_trainer_relationships")
        .select("trainer_id")
        .eq("client_id", clientId);
        
      if (fetchError) throw fetchError;
      
      const existingTrainerIds = existingRelationships?.map(rel => rel.trainer_id) || [];
      
      // Find trainers to add (new trainers) and remove (no longer in the list)
      const trainersToAdd = trainerIds.filter(id => !existingTrainerIds.includes(id));
      const trainersToRemove = existingTrainerIds.filter(id => !trainerIds.includes(id));
      
      console.log("Trainers to add:", trainersToAdd);
      console.log("Trainers to remove:", trainersToRemove);
      
      // Remove relationships that are no longer valid
      if (trainersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("client_trainer_relationships")
          .delete()
          .eq("client_id", clientId)
          .in("trainer_id", trainersToRemove);
          
        if (deleteError) throw deleteError;
      }
      
      // Add new relationships
      if (trainersToAdd.length > 0) {
        const newRelationships = trainersToAdd.map(trainerId => ({
          client_id: clientId,
          trainer_id: trainerId,
          is_primary: trainerIds.indexOf(trainerId) === 0 // Make the first trainer primary
        }));
        
        const { error: insertError } = await supabase
          .from("client_trainer_relationships")
          .insert(newRelationships);
          
        if (insertError) throw insertError;
      }
      
      // Update existing relationships to set primary trainer
      if (trainerIds.length > 0) {
        const primaryTrainerId = trainerIds[0]; // First trainer in the list is primary
        
        // Update is_primary for all existing relationships
        await Promise.all(
          existingTrainerIds
            .filter(id => trainerIds.includes(id))
            .map(async (trainerId) => {
              const isPrimary = trainerId === primaryTrainerId;
              
              const { error } = await supabase
                .from("client_trainer_relationships")
                .update({ is_primary: isPrimary })
                .eq("client_id", clientId)
                .eq("trainer_id", trainerId);
                
              if (error) throw error;
            })
        );
        
        // Also update current_trainer_id in clients table
        const { error: updateError } = await supabase
          .from("clients")
          .update({ current_trainer_id: primaryTrainerId })
          .eq("id", clientId);
          
        if (updateError) throw updateError;
      } else {
        // No trainers - clear the primary trainer
        const { error: updateError } = await supabase
          .from("clients")
          .update({ current_trainer_id: null })
          .eq("id", clientId);
          
        if (updateError) throw updateError;
      }

      // Update local state
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
