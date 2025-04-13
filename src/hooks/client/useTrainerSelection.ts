
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

  // Main function to load trainers
  const loadTrainers = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      
      if (!currentUser?.email) {
        throw new Error("No se pudo determinar el usuario actual");
      }
      
      const clientData = await fetchClientData(currentUser.email);
      
      if (!clientData) {
        handleNoClientData();
        return;
      }

      const trainerIds = getTrainerIds(clientData);
      
      if (trainerIds.length > 0) {
        const trainersData = await fetchTrainersData(trainerIds);
        
        if (!trainersData || trainersData.length === 0) {
          handleNoTrainersFound();
          return;
        }
        
        const trainersWithBranding = await attachBrandingToTrainers(trainersData);
        setTrainers(trainersWithBranding);
        
        handleTrainerSelection(trainersWithBranding);
      } else {
        setDefaultTrainer();
      }
    } catch (error: any) {
      handleLoadError();
    } finally {
      setLoading(false);
    }
  };

  // Get the current authenticated user
  const getCurrentUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  };

  // Fetch client data from the database
  const fetchClientData = async (email: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
      
    if (error) {
      throw error;
    }
    
    return data;
  };

  // Extract trainer IDs from client data
  const getTrainerIds = (clientData: any) => {
    let trainerIds: string[] = [];
    
    if (clientData.trainers && clientData.trainers.length > 0) {
      trainerIds = clientData.trainers;
    } else if (clientData.trainer_id) {
      trainerIds = [clientData.trainer_id];
    }
    
    return trainerIds;
  };

  // Fetch trainers' data from the database
  const fetchTrainersData = async (trainerIds: string[]) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", trainerIds);
      
    if (error) {
      throw error;
    }
    
    return data;
  };

  // Attach branding information to trainers
  const attachBrandingToTrainers = async (trainersData: any[]) => {
    const trainersWithBranding: Trainer[] = [];
    
    for (const trainer of trainersData) {
      const { data: brandData } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", trainer.id)
        .maybeSingle();
      
      trainersWithBranding.push(createTrainerWithBranding(trainer, brandData));
    }
    
    return trainersWithBranding;
  };

  // Create a trainer object with branding information
  const createTrainerWithBranding = (trainer: any, brandData: any): Trainer => {
    return {
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
    };
  };

  // Handle case when no client data is found
  const handleNoClientData = () => {
    const defaultTrainer: Trainer = createDefaultTrainer("default-trainer", "Entrenador Predeterminado");
    setTrainers([defaultTrainer]);
    handleTrainerSelect(defaultTrainer.id);
    
    toast({
      title: "Sin información de cliente",
      description: "No encontramos tus datos de cliente. Contacta a soporte o tu entrenador.",
      variant: "default"
    });
  };

  // Handle case when no trainers are found
  const handleNoTrainersFound = () => {
    toast({
      title: "No se encontraron entrenadores",
      description: "Contacta con soporte para asignar entrenadores",
      variant: "default"
    });
    
    const fallbackTrainer: Trainer = createDefaultTrainer("fallback-trainer", "Entrenador Predeterminado");
    setTrainers([fallbackTrainer]);
    handleTrainerSelect(fallbackTrainer.id);
  };

  // Set a default demo trainer
  const setDefaultTrainer = () => {
    const demoTrainer: Trainer = createDefaultTrainer("demo-trainer", "Entrenador Demo");
    setTrainers([demoTrainer]);
    handleTrainerSelect(demoTrainer.id);
  };

  // Handle errors during trainer loading
  const handleLoadError = () => {
    toast({
      title: "No se pudieron cargar entrenadores",
      description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
      variant: "destructive"
    });
    
    const fallbackTrainer: Trainer = createDefaultTrainer("fallback-trainer", "Entrenador Predeterminado");
    setTrainers([fallbackTrainer]);
    handleTrainerSelect(fallbackTrainer.id);
  };

  // Create a default trainer object
  const createDefaultTrainer = (id: string, name: string): Trainer => {
    return {
      id,
      name,
      branding: {
        logo_url: null,
        primary_color: "#9b87f5",
        secondary_color: "#E5DEFF",
        accent_color: "#7E69AB"
      }
    };
  };

  // Handle initial trainer selection logic
  const handleTrainerSelection = (availableTrainers: Trainer[]) => {
    if (!selectedTrainerId && availableTrainers.length > 0) {
      const firstTrainer = availableTrainers[0];
      handleTrainerSelect(firstTrainer.id);
    } else if (selectedTrainerId) {
      const selectedTrainer = availableTrainers.find(t => t.id === selectedTrainerId);
      if (selectedTrainer) {
        applyTrainerTheme(selectedTrainer);
      } else if (availableTrainers.length > 0) {
        handleTrainerSelect(availableTrainers[0].id);
      }
    }
  };

  // Handle trainer selection from UI
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

  // Apply the trainer's theme to the application
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
