
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvitationResponseModal } from "@/components/client/InvitationResponseModal";
import { TrainerInvitation } from "@/components/client/types";

interface Trainer {
  id: string;
  name: string;
  branding?: {
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
}

const ClientLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [trainerBranding, setTrainerBranding] = useState<Trainer['branding'] | null>(null);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<TrainerInvitation | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const { toast } = useToast();

  // Check for token and email in the URL
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const hasInvitationParams = !!(token && emailParam);

  // If token and email are in URL, pre-fill the email field
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && isClient) {
      if (hasInvitationParams) {
        // Check for invitation after login
        checkInvitationAfterLogin(token as string, emailParam as string);
      } else {
        navigate("/client-dashboard");
      }
    }
  }, [user, isClient, navigate, hasInvitationParams, token, emailParam]);

  const checkInvitationAfterLogin = async (token: string, email: string) => {
    try {
      // Check if the invitation exists and is valid, using status field now
      const { data: invitationData, error: invitationError } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("token", token)
        .eq("email", email.toLowerCase())
        .eq("status", "pending") // Changed from 'accepted' boolean to 'status' field
        .single();
        
      if (invitationError) throw invitationError;
      
      if (invitationData) {
        // Get trainer name
        const { data: trainerData, error: trainerError } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", invitationData.trainer_id)
          .single();
          
        if (trainerError) throw trainerError;
        
        // Show modal to accept/reject invitation
        setPendingInvitation({
          id: invitationData.id,
          email: invitationData.email,
          trainer_id: invitationData.trainer_id,
          trainer_name: trainerData?.name || "Entrenador",
          created_at: invitationData.created_at,
          status: invitationData.status
        });
        setShowInvitationModal(true);
      } else {
        // If no pending invitation, proceed to trainer selection
        handleTrainerSelectionAfterLogin();
      }
    } catch (error) {
      console.error("Error checking invitation:", error);
      // If there's an error, continue with normal flow
      handleTrainerSelectionAfterLogin();
    }
  };

  const handleTrainerSelectionAfterLogin = async () => {
    try {
      if (!user?.email) return;
      
      // Find trainers for this client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("trainers")
        .eq("email", user.email.toLowerCase())
        .single();
        
      if (clientError && clientError.code !== 'PGRST116') throw clientError;
        
      if (clientData && clientData.trainers && clientData.trainers.length > 0) {
        // Fetch trainer information
        const { data: trainerData, error: trainerError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", clientData.trainers);
          
        if (trainerError) throw trainerError;
        
        const trainersWithBranding: Trainer[] = [];
        
        for (const trainer of trainerData || []) {
          const { data: brandData } = await supabase
            .from("trainer_brands")
            .select("*")
            .eq("trainer_id", trainer.id)
            .maybeSingle();
          
          trainersWithBranding.push({
            id: trainer.id,
            name: trainer.name || "Unnamed trainer",
            branding: brandData ? {
              logo_url: brandData.logo_url,
              primary_color: brandData.primary_color || "#9b87f5",
              secondary_color: brandData.secondary_color || "#E5DEFF",
              accent_color: brandData.accent_color || "#7E69AB"
            } : undefined
          });
        }
        
        setTrainers(trainersWithBranding);
        
        // If only one trainer, auto-select and proceed
        if (trainersWithBranding.length === 1) {
          setSelectedTrainer(trainersWithBranding[0].id);
          applyTrainerTheme(trainersWithBranding[0]);
          navigateToClientDashboard();
        } else if (trainersWithBranding.length > 1) {
          // Show modal for trainer selection
          setShowTrainerModal(true);
        } else {
          throw new Error("No hay entrenadores asignados a esta cuenta.");
        }
      } else {
        throw new Error("No hay entrenadores asignados a esta cuenta.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron cargar los entrenadores.",
      });
    }
  };

  // Handle first step - email/password authentication
  const handleFirstStepLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // First, authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // The rest will be handled by the useEffect for user & isClient
        toast({
          title: "Inicio de sesión exitoso",
          description: "¡Bienvenido!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Verifica tus credenciales e inténtalo nuevamente.",
      });
      
      // Sign out in case of error
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
      
      // Use status field instead of accepted boolean
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      if (user) {
        const { data: existingClient, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("email", user.email?.toLowerCase() || '')
          .maybeSingle();

        if (clientError && clientError.code !== 'PGRST116') throw clientError;

        if (existingClient) {
          // Add relationship in the client_trainer_relationships table
          await supabase
            .from("client_trainer_relationships")
            .insert({
              client_id: existingClient.id,
              trainer_id: trainerId,
              is_primary: !existingClient.trainer_id
            });
          
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
              email: user.email?.toLowerCase() || '',
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente',
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

        toast({
          title: "Invitación aceptada",
          description: "Te has conectado exitosamente con el entrenador.",
        });
        
        // After accepting the invitation, proceed to trainer selection
        handleTrainerSelectionAfterLogin();
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo aceptar la invitación.",
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      console.log("Rejecting invitation:", invitationId);
      
      // Update status instead of deleting
      const { error } = await supabase
        .from("client_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId);

      if (error) throw error;
      
      toast({
        title: "Invitación rechazada",
        description: "Has rechazado la invitación del entrenador.",
      });
      
      // After rejecting the invitation, proceed to trainer selection
      handleTrainerSelectionAfterLogin();
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo rechazar la invitación.",
      });
    }
  };

  const applyTrainerTheme = (trainer: Trainer) => {
    if (trainer.branding) {
      setTrainerBranding(trainer.branding);
      
      // Apply theme to CSS variables
      document.documentElement.style.setProperty('--client-primary', trainer.branding.primary_color);
      document.documentElement.style.setProperty('--client-secondary', trainer.branding.secondary_color);
      document.documentElement.style.setProperty('--client-accent', trainer.branding.accent_color);
    }
  };

  const handleTrainerSelect = (trainerId: string) => {
    const selected = trainers.find(t => t.id === trainerId);
    if (selected) {
      setSelectedTrainer(trainerId);
      applyTrainerTheme(selected);
    }
  };

  const navigateToClientDashboard = () => {
    if (selectedTrainer) {
      // Store selected trainer ID in session storage
      sessionStorage.setItem('selected_trainer_id', selectedTrainer);
      navigate("/client-dashboard");
    }
  };

  // Handle selection from trainer modal
  const confirmTrainerSelection = () => {
    if (selectedTrainer) {
      setShowTrainerModal(false);
      navigateToClientDashboard();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona un entrenador para continuar.",
      });
    }
  };

  // Dynamic styles based on selected trainer
  const dynamicStyles = trainerBranding ? {
    cardStyle: {
      borderColor: trainerBranding.primary_color,
      borderWidth: "2px",
    },
    buttonStyle: {
      backgroundColor: trainerBranding.primary_color,
      color: "#ffffff",
    },
    headerStyle: {
      backgroundColor: trainerBranding.secondary_color,
      borderTopLeftRadius: "0.5rem",
      borderTopRightRadius: "0.5rem",
    }
  } : {};

  return (
    <div className="grid h-screen place-items-center bg-gray-100">
      <Card className="w-[400px]" style={dynamicStyles.cardStyle}>
        <CardHeader className="space-y-1" style={dynamicStyles.headerStyle}>
          <CardTitle className="text-2xl text-center">
            Acceso para Clientes
          </CardTitle>
          <CardDescription className="text-center">
            Inicia sesión con tus credenciales de cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 mt-4">
          <form onSubmit={handleFirstStepLogin} className="space-y-4">
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  placeholder="correo@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  placeholder="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                style={dynamicStyles.buttonStyle}
                className="mt-4 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </>
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Button 
                  variant="link" 
                  onClick={() => navigate("/auth")}
                >
                  Ir a inicio de sesión general
                </Button>
              </div>
              
              {hasInvitationParams && (
                <div className="text-center mt-2">
                  <Button 
                    variant="link" 
                    onClick={() => navigate(`/auth?token=${token}&email=${emailParam}`)}
                  >
                    No tengo cuenta - Crear cuenta
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Trainer selection modal */}
      <Dialog open={showTrainerModal} onOpenChange={setShowTrainerModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Selecciona tu Entrenador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="trainer-select">Entrenador</Label>
              <Select
                value={selectedTrainer || ""}
                onValueChange={handleTrainerSelect}
              >
                <SelectTrigger id="trainer-select">
                  <SelectValue placeholder="Selecciona un entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTrainer && trainerBranding && trainerBranding.logo_url && (
              <div className="flex justify-center my-4">
                <img 
                  src={trainerBranding.logo_url} 
                  alt="Trainer logo" 
                  className="h-16 object-contain"
                />
              </div>
            )}
            
            <Button
              onClick={confirmTrainerSelection}
              disabled={!selectedTrainer}
              className="w-full"
              style={trainerBranding ? { 
                backgroundColor: trainerBranding.primary_color,
                color: "#ffffff"
              } : undefined}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation modal */}
      <InvitationResponseModal
        invitation={pendingInvitation}
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        onAccept={handleAcceptInvitation}
        onReject={handleRejectInvitation}
      />
    </div>
  );
};

export default ClientLogin;
