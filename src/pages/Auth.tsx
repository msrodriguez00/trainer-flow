
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { InvitationHandler } from "@/components/auth/InvitationHandler";

const Auth = () => {
  const [type, setType] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [invitationEmail, setInvitationEmail] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, profile, isClient, isTrainer, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      redirectBasedOnRole();
    }
  }, [profile]);
  
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
      await signUp({ email, password, name, trainerId: trainerId || invitationData?.trainer_id });
      
      if (invitationData) {
        const { error: acceptError } = await supabase
          .from("client_invitations")
          .update({ accepted: true })
          .eq("token", invitationData.token);
          
        if (acceptError) throw acceptError;
      }
      
      toast({
        title: "Registro exitoso",
        description: "¡Te has registrado correctamente!",
      });
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

  const handleInvitationLoaded = ({ email, trainerId, trainers, invitationData }: any) => {
    setType("sign-up");
    setInvitationEmail(email);
    setSelectedTrainer(trainerId);
    setTrainers(trainers);
    setInvitationData(invitationData);
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
            isInvitation={!!invitationData}
          />
        )}
      </AuthCard>
    </div>
  );
};

export default Auth;
