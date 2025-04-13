
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TrainerInvitation } from "@/components/client/types";
import { fetchPendingInvitationsByEmail, acceptInvitation, rejectInvitation } from "@/services/invitationService";
import { formatDate } from "@/utils/dateUtils";

export function useInvitations() {
  const [invitations, setInvitations] = useState<TrainerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPendingInvitations = useCallback(async () => {
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
      
      const formattedInvitations = await fetchPendingInvitationsByEmail(userEmail);
      console.log("Invitations received:", formattedInvitations);
      setInvitations(formattedInvitations);
      
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
  }, [user?.email, toast]);

  useEffect(() => {
    if (user?.email) {
      console.log("Client user is available, fetching invitations for:", user.email);
      fetchPendingInvitations();
    } else {
      console.log("No user email available, skipping invitation fetch");
      setLoading(false);
      if (!user && window.location.pathname !== "/auth") {
        setError("Debes iniciar sesión para ver invitaciones");
      }
    }
  }, [user?.email, fetchPendingInvitations]);

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    if (!user?.email || !user?.id) {
      console.log("No user email in handleAcceptInvitation, aborting");
      return;
    }
    
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      await acceptInvitation(invitationId, trainerId, user.id, user.email);

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
      await rejectInvitation(invitationId);

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

  return {
    invitations,
    loading,
    error,
    processingIds,
    handleAcceptInvitation,
    handleRejectInvitation,
    formatDate,
    refreshInvitations: fetchPendingInvitations
  };
}
