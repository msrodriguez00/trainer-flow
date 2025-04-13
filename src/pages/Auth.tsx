import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { InvitationHandler } from "@/components/auth/InvitationHandler";
import { InvitationResponseModal } from "@/components/client/InvitationResponseModal";
import { TrainerInvitation } from "@/components/client/types";

const Auth = () => {
  const [type, setType] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string>("");
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<TrainerInvitation | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, profile, isClient, isTrainer, isAdmin, user } = useAuth();
  const { toast } = useToast();

  // Check for email in the URL for invitation handling
  const email = searchParams.get("email");
  const hasInvitationParams = !!email;

  useEffect(() => {
    if (profile) {
      if (hasInvitationParams) {
        // If we have invitation params and the user is logged in, check the invitation
        checkInvitationAfterLogin(email as string);
      } else {
        redirectBasedOnRole();
      }
    }
  }, [profile]);
  
  const checkInvitationAfterLogin = async (email: string) => {
    try {
      // Check if the invitation exists and is valid
      const { data: invitationData, error: invitationError } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .maybeSingle();
        
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
          status: invitationData.status as 'pending' | 'accepted' | 'rejected'
        });
        setShowInvitationModal(true);
      } else {
        // If no pending invitation, redirect based on role
        redirectBasedOnRole();
      }
    } catch (error) {
      console.error("Error checking invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo verificar la invitación. Intente nuevamente.",
      });
      redirectBasedOnRole();
    }
  };
  
  const redirectBasedOnRole = () => {
    if (isAdmin) {
      navigate("/admin");
    } else if (isTrainer) {
      navigate("/trainer-dashboard");
    } else if (isClient) {
      navigate("/client-dashboard");
    } else {
      navigate("/");
    }
  };
  
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn({ email, password });
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      // Don't redirect here - we'll handle this in the useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (name: string, email: string, password: string, trainerId: string | null) => {
    setLoading(true);
    try {
      await signUp({ email, password, name, trainerId: trainerId || selectedTrainer });
      
      if (invitationId) {
        toast({
          title: "Registro exitoso",
          description: "Te has registrado correctamente. Por favor acepta o rechaza la invitación del entrenador.",
        });
      } else {
        toast({
          title: "Registro exitoso",
          description: "¡Te has registrado correctamente!",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string, trainerId: string) => {
    try {
      console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
      
      // Update status instead of accepted boolean
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
      }
      
      toast({
        title: "Invitación aceptada",
        description: "Te has conectado exitosamente con el entrenador.",
      });
      
      // Redirect to the client dashboard
      navigate("/client-dashboard");
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
      
      // Redirect based on role
      redirectBasedOnRole();
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo rechazar la invitación.",
      });
    }
  };

  const handleInvitationLoaded = ({ email, trainerId, trainers, invitationId }: any) => {
    // Switch to sign-up if no user is logged in
    if (!user) {
      setType("sign-up");
    }
    setInvitationEmail(email);
    setSelectedTrainer(trainerId);
    setTrainers(trainers);
    setInvitationId(invitationId);
  };

  return (
    <div className="grid h-screen place-items-center bg-gray-100">
      <InvitationHandler onInvitationLoaded={handleInvitationLoaded} />
      
      <AuthCard 
        type={type} 
        onTypeChange={setType} 
        from={location.state?.from}
      >
        {type === "sign-in" ? (
          <LoginForm onLogin={handleSignIn} loading={loading} />
        ) : (
          <SignupForm 
            onSignup={handleSignUp} 
            loading={loading}
            trainers={trainers}
            initialEmail={invitationEmail}
            preselectedTrainer={selectedTrainer}
            isInvitation={!!invitationId}
          />
        )}
      </AuthCard>

      {/* Modal for accepting/rejecting invitations after login */}
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

export default Auth;
