
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
import { Check, X, Loader2, UserPlus } from "lucide-react";

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
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.email) {
      fetchPendingInvitations();
    } else {
      // If no user email, clear loading state to prevent endless loading
      setLoading(false);
    }
  }, [user]);

  const fetchPendingInvitations = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      console.log("Fetching invitations for email:", user.email);
      
      // Obtener las invitaciones pendientes para el correo del usuario
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("client_invitations")
        .select(`
          id,
          email,
          trainer_id,
          created_at,
          profiles:trainer_id (name)
        `)
        .eq("email", user.email)
        .eq("accepted", false)
        .order("created_at", { ascending: false });

      if (invitationsError) {
        console.error("Error fetching invitations:", invitationsError);
        throw invitationsError;
      }

      console.log("Invitations data:", invitationsData);

      // Transformar los datos para incluir el nombre del entrenador
      const formattedInvitations: TrainerInvitation[] = invitationsData.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        trainer_id: inv.trainer_id,
        trainer_name: inv.profiles?.name || "Entrenador",
        created_at: inv.created_at
      }));

      setInvitations(formattedInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
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
    if (!user?.email) return;
    
    setProcessingIds(prev => [...prev, invitationId]);
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
      
      // Marcar la invitación como aceptada
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ accepted: true })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      // Verificar si el usuario ya existe como cliente
      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') throw clientError;

      if (existingClient) {
        // Si el cliente existe, añadir el nuevo entrenador a su lista de entrenadores
        const updatedTrainers = [...(existingClient.trainers || [])];
        if (!updatedTrainers.includes(trainerId)) {
          updatedTrainers.push(trainerId);
          
          await supabase
            .from("clients")
            .update({ trainers: updatedTrainers })
            .eq("id", existingClient.id);
        }
      } else {
        // Si el cliente no existe, crearlo
        await supabase
          .from("clients")
          .insert({
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            trainer_id: trainerId,
            trainers: [trainerId],
            user_id: user.id
          });
      }

      // Eliminar la invitación de la lista local
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
      
      // Eliminar la invitación
      const { error } = await supabase
        .from("client_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      // Eliminar la invitación de la lista local
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
