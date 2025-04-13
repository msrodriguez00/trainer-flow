
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TrainerInvitation } from "@/components/client/types";
import { 
  fetchPendingInvitationsByEmail, 
  acceptInvitation, 
  rejectInvitation 
} from "@/services/invitationService";
import { formatDate } from "@/utils/dateUtils";

export function useInvitations() {
  const [invitations, setInvitations] = useState<TrainerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const isFirstMount = useRef(true);
  const isFetching = useRef(false);

  const fetchPendingInvitations = useCallback(async () => {
    if (!user?.email || isFetching.current) {
      console.log("Skipping fetch: No user email or fetch already in progress");
      setLoading(false);
      return;
    }
    
    console.log("=== STARTING INVITATION FETCH PROCESS ===");
    console.log("User auth object:", user);
    console.log("Current route:", window.location.pathname);
    console.log("Last refresh timestamp:", lastRefresh);
    
    isFetching.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Make sure email is normalized before sending to the service
      const userEmail = user.email.toLowerCase().trim();
      console.log("fetchPendingInvitations - About to call API with email:", userEmail);
      
      const formattedInvitations = await fetchPendingInvitationsByEmail(userEmail);
      console.log("fetchPendingInvitations - API call completed, invitations received:", formattedInvitations.length);
      
      // Deep comparison to prevent unnecessary state updates
      const invitationsChanged = JSON.stringify(invitations) !== JSON.stringify(formattedInvitations);
      
      if (invitationsChanged || invitations.length !== formattedInvitations.length) {
        console.log("Setting new invitations state:", formattedInvitations);
        setInvitations(formattedInvitations);
        
        // Only show toast if it's not the initial load and invitations have changed
        if (lastRefresh > 0 && invitationsChanged && !isFirstMount.current) {
          if (formattedInvitations.length > 0) {
            toast({
              title: "Invitaciones actualizadas",
              description: `Se encontraron ${formattedInvitations.length} invitaciones pendientes.`,
            });
          }
        }
      } else {
        console.log("No changes in invitations detected");
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
      isFetching.current = false;
      isFirstMount.current = false;
      console.log("=== INVITATION FETCH PROCESS COMPLETED ===");
    }
  }, [user?.email, toast]); // Removed invitations and lastRefresh from dependencies

  // Separate function to refresh invitations and update lastRefresh
  const refreshInvitations = useCallback(() => {
    console.log("Manual refresh triggered");
    setLastRefresh(Date.now());
    return fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  useEffect(() => {
    if (user?.email && isFirstMount.current) {
      console.log("Client user is available, fetching invitations for:", user.email);
      fetchPendingInvitations();
    } else {
      console.log("No user email available or not first mount, skipping invitation fetch");
      setLoading(false);
      if (!user && window.location.pathname !== "/auth") {
        setError("Debes iniciar sesión para ver invitaciones");
      }
    }
  }, [user?.email, fetchPendingInvitations]);

  // Effect that reacts to lastRefresh changes
  useEffect(() => {
    if (lastRefresh > 0 && !isFirstMount.current && user?.email) {
      console.log("Last refresh timestamp changed, fetching invitations");
      fetchPendingInvitations();
    }
  }, [lastRefresh, fetchPendingInvitations, user?.email]);

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    if (!user?.email || !user?.id) {
      console.log("No user email in handleAcceptInvitation, aborting");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se puede aceptar la invitación sin iniciar sesión.",
      });
      return;
    }
    
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId, "user:", user.id);
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
      console.log("Rejecting invitation:", invitationId);
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
    refreshInvitations
  };
}
