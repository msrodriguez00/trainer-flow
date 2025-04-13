
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trainer } from "@/components/client/dashboard/types";

export const useTrainerSelection = (onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(
    sessionStorage.getItem('selected_trainer_id') || ""
  );
  const [trainerName, setTrainerName] = useState<string>(
    sessionStorage.getItem('selected_trainer_name') || "Tu Entrenador"
  );
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Cargar la lista de entrenadores disponibles para este cliente
  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      console.log("Iniciando carga de entrenadores...");
      
      // Obtener el email del cliente actual
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log("Auth session:", session);
      
      if (!user?.email) {
        console.error("No se pudo determinar el usuario actual");
        throw new Error("No se pudo determinar el usuario actual");
      }
      
      console.log("Usuario actual:", user.email, "ID:", user.id);
      
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
      
      // Verificar si hay un problema de correspondencia de usuario
      if (!clientData) {
        console.log("⚠️ No se encontró registro de cliente para el email:", user.email);
        console.log("⚠️ Verificando si existe el cliente por user_id:", user.id);
        
        // Intentar buscar por user_id como alternativa
        const { data: clientByUserId, error: userIdError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (userIdError) {
          console.error("Error al buscar cliente por user_id:", userIdError);
        } else {
          console.log("Resultado de búsqueda por user_id:", clientByUserId);
        }
        
        // Si no se encuentra, mostrar trainer por defecto
        const defaultTrainer: Trainer = {
          id: "default-trainer",
          name: "Entrenador Predeterminado",
          branding: {
            logo_url: null,
            primary_color: "#9b87f5",
            secondary_color: "#E5DEFF",
            accent_color: "#7E69AB"
          }
        };
        
        setTrainers([defaultTrainer]);
        handleTrainerSelect(defaultTrainer.id);
        setLoading(false);
        
        toast({
          title: "Sin información de cliente",
          description: "No encontramos tus datos de cliente. Contacta a soporte o tu entrenador.",
          variant: "default"
        });
        
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
            description: "Contacta con soporte para asignar entrenadores",
            variant: "default"
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
        // Si no hay entrenadores, crear uno de prueba para mostrar la interfaz
        console.log("No hay entrenadores asignados");
        
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
      
      // Mostrar mensaje de error más detallado
      toast({
        title: "No se pudieron cargar entrenadores",
        description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
        variant: "destructive"
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

  return {
    trainers,
    loading,
    selectedTrainerId,
    trainerName,
    handleTrainerSelect,
    loadTrainers
  };
};
