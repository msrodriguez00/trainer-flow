
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, UserPlus, AlertCircle } from "lucide-react";

interface TrainerInvitation {
  id: string;
  email: string;
  trainer_id: string;
  trainer_name: string;
  created_at: string;
}

const PendingInvitationsCard = () => {
  const [invitations, setInvitations] = useState<TrainerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user, isClient } = useAuth();
  const { toast } = useToast();

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
      
      // First, fetch the invitations without the join
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("client_invitations")
        .select("id, email, trainer_id, created_at")
        .eq("email", userEmail)
        .eq("accepted", false)
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
            created_at: invitation.created_at
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

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    if (!user?.email) {
      console.log("No user email in handleAcceptInvitation, aborting");
      return;
    }
    
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
      
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ accepted: true })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email.toLowerCase()) // Ensure email is lowercase
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') throw clientError;

      if (existingClient) {
        const updatedTrainers = [...(existingClient.trainers || [])];
        if (!updatedTrainers.includes(trainerId)) {
          updatedTrainers.push(trainerId);
          
          await supabase
            .from("clients")
            .update({ trainers: updatedTrainers })
            .eq("id", existingClient.id);
        }
      } else {
        await supabase
          .from("clients")
          .insert({
            email: user.email.toLowerCase(), // Ensure email is lowercase
            name: user.user_metadata?.name || user.email.split('@')[0],
            trainer_id: trainerId,
            trainers: [trainerId],
            user_id: user.id
          });
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
      
      const { error } = await supabase
        .from("client_invitations")
        .delete()
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

  if (window.location.pathname === "/auth") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Invitaciones de Entrenadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
            <p className="font-medium">Por favor inicia sesión como cliente</p>
            <p className="text-sm text-gray-500 mt-1">
              Para ver invitaciones, usa la página de <a href="/client-login" className="text-blue-500 hover:underline">acceso para clientes</a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Invitaciones de Entrenadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p>{error}</p>
            {window.location.pathname !== "/client-login" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.href = '/client-login'}
              >
                Ir a acceso para clientes
              </Button>
            )}
          </div>
        ) : invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-medium">{invitation.trainer_name}</h3>
                  <p className="text-sm text-gray-500">Invitación enviada el {formatDate(invitation.created_at)}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={processingIds.includes(invitation.id)}
                    onClick={() => handleRejectInvitation(invitation.id)}
                  >
                    {processingIds.includes(invitation.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={processingIds.includes(invitation.id)}
                    onClick={() => handleAcceptInvitation(invitation.id, invitation.trainer_id)}
                  >
                    {processingIds.includes(invitation.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Aceptar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">
            No tienes invitaciones pendientes.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsCard;
