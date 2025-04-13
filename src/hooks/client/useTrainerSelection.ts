
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

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("No se pudo determinar el usuario actual");
      }
      
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
        
      if (clientError) {
        throw clientError;
      }
      
      if (!clientData) {
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

      let trainersToUse: string[] = [];
      
      if (clientData.trainers && clientData.trainers.length > 0) {
        trainersToUse = clientData.trainers;
      } else if (clientData.trainer_id) {
        trainersToUse = [clientData.trainer_id];
      }
      
      if (trainersToUse.length > 0) {
        const { data: trainerData, error: trainerError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", trainersToUse);
          
        if (trainerError) {
          throw trainerError;
        }
        
        if (!trainerData || trainerData.length === 0) {
          toast({
            title: "No se encontraron entrenadores",
            description: "Contacta con soporte para asignar entrenadores",
            variant: "default"
          });
          
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
              logo_url: null,
              primary_color: "#9b87f5",
              secondary_color: "#E5DEFF",
              accent_color: "#7E69AB"
            }
          });
        }
        
        setTrainers(trainersWithBranding);
        
        if (!selectedTrainerId && trainersWithBranding.length > 0) {
          const firstTrainer = trainersWithBranding[0];
          handleTrainerSelect(firstTrainer.id);
        } else if (selectedTrainerId) {
          const selectedTrainer = trainersWithBranding.find(t => t.id === selectedTrainerId);
          if (selectedTrainer) {
            applyTrainerTheme(selectedTrainer);
          } else if (trainersWithBranding.length > 0) {
            handleTrainerSelect(trainersWithBranding[0].id);
          }
        }
      } else {
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
      toast({
        title: "No se pudieron cargar entrenadores",
        description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
        variant: "destructive"
      });
      
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
      
      applyTrainerTheme(selected);
      
      if (onTrainerChange) {
        onTrainerChange(selected.id, selected.name, selected.branding);
      }
    }
  };

  const applyTrainerTheme = (trainer: Trainer) => {
    if (trainer.branding) {
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      
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
