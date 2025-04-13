
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user, isClient } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && isClient) {
      navigate("/client-dashboard");
    }
  }, [user, isClient, navigate]);

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
        // Check if this user is actually a client
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profileData.role !== 'client') {
          // Not a client, sign them out
          await supabase.auth.signOut();
          throw new Error("Esta cuenta no pertenece a un cliente.");
        }
        
        // Find trainers for this client
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("trainers")
          .eq("email", email.toLowerCase())
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
    </div>
  );
};

export default ClientLogin;
