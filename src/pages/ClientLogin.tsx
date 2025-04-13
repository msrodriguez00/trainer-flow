
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  const navigate = useNavigate();
  const { signIn, user, isClient } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && isClient) {
      navigate("/client-dashboard");
    }
  }, [user, isClient, navigate]);

  // Fetch trainers for this client's email
  useEffect(() => {
    const fetchTrainers = async () => {
      if (!email) return;
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("trainers")
          .eq("email", email.toLowerCase())
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data && data.trainers && data.trainers.length > 0) {
          const { data: trainerData, error: trainerError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", data.trainers);
          
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
          
          // Auto-select if only one trainer
          if (trainersWithBranding.length === 1) {
            setSelectedTrainer(trainersWithBranding[0].id);
            setTrainerBranding(trainersWithBranding[0].branding || null);
          }
        }
      } catch (error) {
        console.error("Error fetching trainers:", error);
      }
    };
    
    if (email) {
      fetchTrainers();
    }
  }, [email]);

  // Apply theme when trainer is selected
  useEffect(() => {
    if (selectedTrainer && trainers.length > 0) {
      const selected = trainers.find(t => t.id === selectedTrainer);
      if (selected && selected.branding) {
        setTrainerBranding(selected.branding);
        
        // Apply theme to CSS variables
        document.documentElement.style.setProperty('--client-primary', selected.branding.primary_color);
        document.documentElement.style.setProperty('--client-secondary', selected.branding.secondary_color);
        document.documentElement.style.setProperty('--client-accent', selected.branding.accent_color);
      }
    }
    
    return () => {
      // Reset theme variables when component unmounts
      document.documentElement.style.removeProperty('--client-primary');
      document.documentElement.style.removeProperty('--client-secondary');
      document.documentElement.style.removeProperty('--client-accent');
    };
  }, [selectedTrainer, trainers]);

  const handleSelectTrainer = (trainerId: string) => {
    setSelectedTrainer(trainerId);
    const selected = trainers.find(t => t.id === trainerId);
    if (selected && selected.branding) {
      setTrainerBranding(selected.branding);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTrainer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona un entrenador para continuar.",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signIn({ email, password });
      toast({
        title: "Inicio de sesión exitoso",
        description: "¡Bienvenido de nuevo!",
      });
      navigate("/client-dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Verifica tus credenciales e inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
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
          {trainerBranding && trainerBranding.logo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={trainerBranding.logo_url} 
                alt="Trainer logo" 
                className="h-16 object-contain"
              />
            </div>
          )}
          <CardTitle className="text-2xl text-center">
            Acceso para Clientes
          </CardTitle>
          <CardDescription className="text-center">
            Inicia sesión con tus credenciales de cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 mt-4">
          <form onSubmit={handleLogin} className="space-y-4">
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
              
              {trainers.length > 0 && (
                <div className="grid gap-1">
                  <Label htmlFor="trainer">Entrenador</Label>
                  <Select 
                    value={selectedTrainer || ""} 
                    onValueChange={handleSelectTrainer}
                  >
                    <SelectTrigger>
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
              )}
              
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
                disabled={loading || !selectedTrainer}
                style={dynamicStyles.buttonStyle}
                className="mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
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
    </div>
  );
};

export default ClientLogin;
