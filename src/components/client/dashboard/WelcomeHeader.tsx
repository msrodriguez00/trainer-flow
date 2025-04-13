
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
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  console.log("WelcomeHeader rendered with trainers:", trainers);

  // Cargar la lista de entrenadores disponibles para este cliente
  useEffect(() => {
    const loadTrainers = async () => {
      setLoading(true);
      try {
        console.log("Iniciando carga de entrenadores...");
        
        // Obtener el email del cliente actual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.email) {
          console.error("No se pudo determinar el usuario actual");
          throw new Error("No se pudo determinar el usuario actual");
        }
        
        console.log("Usuario actual:", user.email);
        
        // Buscar el cliente y sus entrenadores asignados
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
          
        if (clientError) {
          console.error("Error al buscar cliente:", clientError);
          throw clientError;
        }
        
        console.log("Client data:", clientData);
        
        if (!clientData) {
          toast({
            title: "No se encontró información de cliente",
            description: "No pudimos encontrar tu información como cliente",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Usar los entrenadores del cliente o su entrenador principal
        let trainersToUse: string[] = [];
        
        if (clientData.trainers && clientData.trainers.length > 0) {
          trainersToUse = clientData.trainers;
          console.log("Usando trainers array:", trainersToUse);
        } else if (clientData.trainer_id) {
          trainersToUse = [clientData.trainer_id];
          console.log("Usando trainer_id:", trainersToUse);
        }
        
        console.log("Trainers to use:", trainersToUse);
        
        if (trainersToUse.length > 0) {
          // Obtener información de los entrenadores
          const { data: trainerData, error: trainerError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", trainersToUse);
            
          if (trainerError) {
            console.error("Error al obtener datos de entrenadores:", trainerError);
            throw trainerError;
          }
          
          console.log("Trainer data:", trainerData);
          
          // Si no hay entrenadores reales, mostrar un error
          if (!trainerData || trainerData.length === 0) {
            toast({
              title: "No se encontraron entrenadores",
              description: "No pudimos encontrar tus entrenadores asignados",
              variant: "destructive"
            });
            
            // Fallback para no romper la UI
            const fallbackTrainer: Trainer = {
              id: "fallback-trainer",
              name: "Entrenador Predeterminado",
              branding: {
                logo_url: null,
                primary_color: "#9b87f5",
                secondary_color: "#E5DEFF",
                accent_color: "#7E69AB"
              }
            };
            
            setTrainers([fallbackTrainer]);
            handleTrainerSelect(fallbackTrainer.id);
            setLoading(false);
            return;
          }
          
          // Cargar la información de branding para cada entrenador
          const trainersWithBranding: Trainer[] = [];
          
          for (const trainer of trainerData) {
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
              } : {
                // Branding por defecto
                logo_url: null,
                primary_color: "#9b87f5",
                secondary_color: "#E5DEFF",
                accent_color: "#7E69AB"
              }
            });
          }
          
          console.log("Trainers with branding:", trainersWithBranding);
          
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
            } else if (trainersWithBranding.length > 0) {
              // Si el entrenador guardado no está en la lista, usar el primero
              handleTrainerSelect(trainersWithBranding[0].id);
            }
          }
        } else {
          // Si no hay entrenadores, mostrar un error y agregar uno de prueba para mostrar la interfaz
          console.log("No hay entrenadores asignados");
          toast({
            title: "Sin entrenadores asignados",
            description: "No tienes entrenadores asignados actualmente",
            variant: "destructive"
          });
          
          const demoTrainer: Trainer = {
            id: "demo-trainer",
            name: "Entrenador Demo",
            branding: {
              logo_url: null,
              primary_color: "#9b87f5",
              secondary_color: "#E5DEFF",
              accent_color: "#7E69AB"
            }
          };
          
          setTrainers([demoTrainer]);
          handleTrainerSelect(demoTrainer.id);
        }
      } catch (error: any) {
        console.error("Error cargando entrenadores:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar tus entrenadores",
        });
        
        // Añadir un entrenador de respaldo para mostrar la interfaz
        const fallbackTrainer: Trainer = {
          id: "fallback-trainer",
          name: "Entrenador Predeterminado",
          branding: {
            logo_url: null,
            primary_color: "#9b87f5",
            secondary_color: "#E5DEFF",
            accent_color: "#7E69AB"
          }
        };
        
        setTrainers([fallbackTrainer]);
        handleTrainerSelect(fallbackTrainer.id);
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
          
          {trainers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">
                {trainers.length > 1 ? "Selecciona tu entrenador:" : "Tu entrenador:"}
              </p>
              
              {trainers.length > 1 ? (
                <Select
                  value={selectedTrainerId}
                  onValueChange={handleTrainerSelect}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full sm:w-[250px] bg-white border-gray-300">
                    <SelectValue placeholder="Selecciona un entrenador" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-600 font-medium p-2 bg-white/50 rounded">
                  {trainers[0]?.name || "Sin entrenador asignado"}
                </p>
              )}
            </div>
          )}
          
          {loading && (
            <div className="text-sm text-gray-500">
              Cargando entrenadores...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
