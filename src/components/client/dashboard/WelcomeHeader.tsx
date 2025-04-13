
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

interface Trainer {
  id: string;
  name: string;
  branding?: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    logo_url: string | null;
  };
}

const WelcomeHeader = ({ userName, userEmail, onTrainerChange }: WelcomeHeaderProps) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(
    sessionStorage.getItem('selected_trainer_id') || ""
  );
  const [trainerName, setTrainerName] = useState<string>(
    sessionStorage.getItem('selected_trainer_name') || "Tu Entrenador"
  );
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Cargar la lista de entrenadores disponibles para este cliente
  useEffect(() => {
    const loadTrainers = async () => {
      setLoading(true);
      try {
        // Obtener el email del cliente actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.email) {
          throw new Error("No se pudo determinar el usuario actual");
        }
        
        // Buscar el cliente y sus entrenadores asignados
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("trainers")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
          
        if (clientError && clientError.code !== 'PGRST116') throw clientError;
        
        if (clientData?.trainers && clientData.trainers.length > 0) {
          // Obtener información de los entrenadores
          const { data: trainerData, error: trainerError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", clientData.trainers);
            
          if (trainerError) throw trainerError;
          
          // Cargar la información de branding para cada entrenador
          const trainersWithBranding: Trainer[] = [];
          
          for (const trainer of trainerData || []) {
            const { data: brandData } = await supabase
              .from("trainer_brands")
              .select("*")
              .eq("trainer_id", trainer.id)
              .maybeSingle();
            
            trainersWithBranding.push({
              id: trainer.id,
              name: trainer.name || "Entrenador sin nombre",
              branding: brandData ? {
                logo_url: brandData.logo_url,
                primary_color: brandData.primary_color || "#9b87f5",
                secondary_color: brandData.secondary_color || "#E5DEFF",
                accent_color: brandData.accent_color || "#7E69AB"
              } : undefined
            });
          }
          
          setTrainers(trainersWithBranding);
          
          // Si hay un trainer seleccionado en la sesión, lo mantenemos
          // De lo contrario, seleccionamos el primero de la lista
          if (!selectedTrainerId && trainersWithBranding.length > 0) {
            const firstTrainer = trainersWithBranding[0];
            handleTrainerSelect(firstTrainer.id);
          } else if (selectedTrainerId) {
            // Verificar si el trainer guardado está en la lista
            const selectedTrainer = trainersWithBranding.find(t => t.id === selectedTrainerId);
            if (selectedTrainer) {
              applyTrainerTheme(selectedTrainer);
            }
          }
        }
      } catch (error: any) {
        console.error("Error cargando entrenadores:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar tus entrenadores",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTrainers();
  }, []);

  const handleTrainerSelect = (trainerId: string) => {
    const selected = trainers.find(t => t.id === trainerId);
    if (selected) {
      setSelectedTrainerId(trainerId);
      setTrainerName(selected.name);
      sessionStorage.setItem('selected_trainer_id', trainerId);
      sessionStorage.setItem('selected_trainer_name', selected.name);
      
      // Aplicar el tema del entrenador
      applyTrainerTheme(selected);
      
      // Notificar al componente padre
      if (onTrainerChange) {
        onTrainerChange(selected.id, selected.name, selected.branding);
      }
    }
  };

  const applyTrainerTheme = (trainer: Trainer) => {
    if (trainer.branding) {
      // Guardar branding en sessionStorage
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      
      // Aplicar tema a las variables CSS
      document.documentElement.style.setProperty('--client-primary', trainer.branding.primary_color);
      document.documentElement.style.setProperty('--client-secondary', trainer.branding.secondary_color);
      document.documentElement.style.setProperty('--client-accent', trainer.branding.accent_color);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/30 border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">¡Bienvenido, {userName}!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">{userEmail}</p>
          
          {trainers.length > 1 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Selecciona tu entrenador:</p>
              <Select
                value={selectedTrainerId}
                onValueChange={handleTrainerSelect}
                disabled={loading}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
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
          ) : (
            trainers.length === 1 && (
              <p className="text-gray-600">
                Entrenador: <span className="font-medium">{trainers[0].name}</span>
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
