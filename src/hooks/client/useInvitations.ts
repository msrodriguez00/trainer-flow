
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainerInvitation } from "@/components/client/types";

export function useInvitations() {
  const [invitations, setInvitations] = useState<TrainerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user, isClient } = useAuth();
  const { toast } = useToast();

  const fetchPendingInvitations = async () => {
    if (!user?.email) {
      console.log("No user email in fetchPendingInvitations, aborting");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userEmail = user.email.toLowerCase();
      console.log("Fetching invitations for email:", userEmail);
      
      // First, fetch the invitations without the join, using the status field now
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("client_invitations")
        .select("id, email, trainer_id, created_at, status")
        .eq("email", userEmail)
        .eq("status", "pending")  // Changed from 'accepted' boolean to 'status' field
        .order("created_at", { ascending: false });

      if (invitationsError) {
        console.error("Error fetching invitations:", invitationsError);
        throw invitationsError;
      }

      console.log("Raw invitations data:", invitationsData);
      
      // If we have invitations, fetch the trainer names separately
      if (invitationsData && invitationsData.length > 0) {
        const formattedInvitations: TrainerInvitation[] = [];
        
        // Get all trainer IDs
        const trainerIds = invitationsData.map(inv => inv.trainer_id);
        
        // Fetch trainer profiles in a single query
        const { data: trainerProfiles, error: trainersError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", trainerIds);
          
        if (trainersError) {
          console.error("Error fetching trainer profiles:", trainersError);
          throw trainersError;
        }
        
        console.log("Trainer profiles:", trainerProfiles);
        
        // Map trainer names to invitations
        for (const invitation of invitationsData) {
          const trainer = trainerProfiles?.find(t => t.id === invitation.trainer_id);
          formattedInvitations.push({
            id: invitation.id,
            email: invitation.email,
            trainer_id: invitation.trainer_id,
            trainer_name: trainer?.name || "Entrenador",
            created_at: invitation.created_at,
            status: invitation.status as 'pending' | 'accepted' | 'rejected'
          });
        }
        
        setInvitations(formattedInvitations);
      } else {
        setInvitations([]);
      }
      
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      setError(`No se pudieron cargar las invitaciones: ${error.message || "Error desconocido"}`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las invitaciones.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email && isClient) {
      console.log("Client user is available, fetching invitations for:", user.email);
      fetchPendingInvitations();
    } else {
      console.log("Not a client user or no email available, skipping invitation fetch");
      console.log("User info:", { email: user?.email, isClient });
      setLoading(false);
      if (user && !isClient && window.location.pathname !== "/auth") {
        setError("Esta sección es solo para clientes");
      } else if (!user && window.location.pathname !== "/auth") {
        setError("Debes iniciar sesión para ver invitaciones");
      }
    }
  }, [user, isClient]);

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    if (!user?.email) {
      console.log("No user email in handleAcceptInvitation, aborting");
      return;
    }
    
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
      
      // Update the status to 'accepted' instead of the 'accepted' boolean
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') throw clientError;

      if (existingClient) {
        // Add relationship in the new client_trainer_relationships table
        await supabase
          .from("client_trainer_relationships")
          .insert({
            client_id: existingClient.id,
            trainer_id: trainerId,
            is_primary: !existingClient.trainer_id
          })
          .select();
        
        // If no primary trainer yet, also update the client record
        if (!existingClient.trainer_id) {
          await supabase
            .from("clients")
            .update({ trainer_id: trainerId })
            .eq("id", existingClient.id);
        }
      } else {
        // Create new client record
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            email: user.email.toLowerCase(),
            name: user.user_metadata?.name || user.email.split('@')[0],
            trainer_id: trainerId,
            trainers: [trainerId],
            user_id: user.id
          })
          .select();
          
        if (insertError) throw insertError;
          
        // Also add relationship to the junction table
        if (newClient && newClient.length > 0) {
          await supabase
            .from("client_trainer_relationships")
            .insert({
              client_id: newClient[0].id,
              trainer_id: trainerId,
              is_primary: true
            });
        }
      }

      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      toast({
        title: "Invitación aceptada",
        description: "Te has conectado exitosamente con el entrenador.",
      });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo aceptar la invitación.",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== invitationId));
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      console.log("Rejecting invitation:", invitationId);
      
      // Update the status to 'rejected' instead of deleting
      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId);

      if (error) throw error;

      setInvitations(invitations.filter(inv => inv.id !== invitationId));
      
      toast({
        title: "Invitación rechazada",
        description: "Has rechazado la invitación del entrenador.",
      });
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo rechazar la invitación.",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== invitationId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return {
    invitations,
    loading,
    error,
    processingIds,
    handleAcceptInvitation,
    handleRejectInvitation,
    formatDate
  };
}
