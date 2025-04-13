
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trainer } from "@/components/client/dashboard/types";
import { useTrainerTheme } from "./useTrainerTheme";

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
  const { applyTrainerTheme } = useTrainerTheme();

  // Load trainers on initial mount
  useEffect(() => {
    loadTrainers();
  }, []);

  // Main function to load trainers
  const loadTrainers = async () => {
    setLoading(true);
    console.log("useTrainerSelection: Loading trainers");
    
    try {
      // Get current user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        console.error("No user email available");
        throw new Error("No se pudo determinar el usuario actual");
      }
      
      console.log("Loading trainers for user email:", user.email);
      
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .maybeSingle();
      
      if (clientError && clientError.code !== 'PGRST116') {
        console.error("Error fetching client data:", clientError);
        throw clientError;
      }
      
      if (!clientData) {
        console.log("No client data found for email:", user.email);
        handleNoClientData();
        return;
      }
      
      console.log("Client data loaded:", clientData);
      
      // Extract trainer IDs
      let trainerIds: string[] = [];
      
      if (clientData.trainers && clientData.trainers.length > 0) {
        trainerIds = clientData.trainers;
      } else if (clientData.trainer_id) {
        trainerIds = [clientData.trainer_id];
      }
      
      console.log("Trainer IDs from client data:", trainerIds);
      
      if (trainerIds.length > 0) {
        // Fetch trainers data
        const { data: trainersData, error: trainersError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", trainerIds);
        
        if (trainersError) {
          console.error("Error fetching trainers data:", trainersError);
          throw trainersError;
        }
        
        console.log("Trainer profiles loaded:", trainersData);
        
        if (!trainersData || trainersData.length === 0) {
          console.log("No trainer profiles found for IDs:", trainerIds);
          handleNoTrainersFound();
          return;
        }
        
        // Fetch branding for each trainer
        const trainersWithBranding: Trainer[] = [];
        
        for (const trainer of trainersData) {
          console.log("Fetching branding for trainer:", trainer.id);
          
          const { data: brandData, error: brandError } = await supabase
            .from("trainer_brands")
            .select("*")
            .eq("trainer_id", trainer.id)
            .maybeSingle();
          
          if (brandError) {
            console.warn("Error fetching branding for trainer:", trainer.id, brandError);
            // Continue with other trainers even if one fails
          }
          
          console.log("Branding data for trainer:", trainer.id, brandData);
          
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
        
        console.log("Final trainers with branding:", trainersWithBranding);
        setTrainers(trainersWithBranding);
        
        // Handle trainer selection
        if (!selectedTrainerId && trainersWithBranding.length > 0) {
          console.log("No trainer selected, selecting first one:", trainersWithBranding[0].id);
          handleTrainerSelect(trainersWithBranding[0].id);
        } else if (selectedTrainerId) {
          console.log("Verifying selected trainer exists:", selectedTrainerId);
          const selectedTrainer = trainersWithBranding.find(t => t.id === selectedTrainerId);
          
          if (selectedTrainer) {
            console.log("Selected trainer found, applying theme:", selectedTrainer);
            applyTrainerTheme(selectedTrainer);
          } else if (trainersWithBranding.length > 0) {
            console.log("Selected trainer not found in data, selecting first one");
            handleTrainerSelect(trainersWithBranding[0].id);
          }
        }
      } else {
        console.log("No trainer IDs available, setting default trainer");
        setDefaultTrainer();
      }
    } catch (error: any) {
      console.error("Error loading trainers:", error);
      handleLoadError();
    } finally {
      setLoading(false);
    }
  };

  // Handle case when no client data is found
  const handleNoClientData = () => {
    console.log("No client data found, creating default trainer");
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
    
    toast({
      title: "Sin información de cliente",
      description: "No encontramos tus datos de cliente. Contacta a soporte o tu entrenador.",
      variant: "default"
    });
  };

  // Handle case when no trainers are found
  const handleNoTrainersFound = () => {
    console.log("No trainers found, creating fallback trainer");
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
    
    toast({
      title: "No se encontraron entrenadores",
      description: "Contacta con soporte para asignar entrenadores",
      variant: "default"
    });
  };

  // Set a default demo trainer
  const setDefaultTrainer = () => {
    console.log("Setting default demo trainer");
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
  };

  // Handle errors during trainer loading
  const handleLoadError = () => {
    console.log("Error loading trainers, creating fallback trainer");
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
    
    toast({
      title: "No se pudieron cargar entrenadores",
      description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
      variant: "destructive"
    });
  };

  // Handle trainer selection from UI
  const handleTrainerSelect = (trainerId: string) => {
    console.log("Trainer selected manually:", trainerId);
    const selected = trainers.find(t => t.id === trainerId);
    
    if (selected) {
      console.log("Applying theme for selected trainer:", selected);
      setSelectedTrainerId(trainerId);
      setTrainerName(selected.name);
      
      // Save to session storage
      sessionStorage.setItem('selected_trainer_id', trainerId);
      sessionStorage.setItem('selected_trainer_name', selected.name);
      
      // Apply theme
      const success = applyTrainerTheme(selected);
      console.log("Theme application result:", success);
      
      // Notify parent component if callback provided
      if (onTrainerChange) {
        onTrainerChange(selected.id, selected.name, selected.branding);
      }
    } else {
      console.error("Selected trainer not found in trainers list:", trainerId);
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
