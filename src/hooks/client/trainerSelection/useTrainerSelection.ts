
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Trainer } from "@/components/client/dashboard/types";
import { useAuth } from "@/hooks/useAuth";
import { UseTrainerSelectionProps, UseTrainerSelectionReturn } from "./types";
import { applyTrainerTheme, applyTrainerThemeToDocument, createDefaultTrainer } from "./trainerThemeUtils";
import { fetchClientTrainerData, fetchTrainersWithBranding } from "./trainerData";

export const useTrainerSelection = (onTrainerChange?: UseTrainerSelectionProps["onTrainerChange"]): UseTrainerSelectionReturn => {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(
    sessionStorage.getItem('selected_trainer_id') || ""
  );
  const [trainerName, setTrainerName] = useState<string>(
    sessionStorage.getItem('selected_trainer_name') || "Tu Entrenador"
  );
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    console.log("useTrainerSelection: Loading trainers");
    
    try {
      // Fetch client data and trainer IDs
      const { clientData, trainerIds, currentTrainerId, error: clientError } = await fetchClientTrainerData(user?.email);
      
      if (clientError) {
        throw clientError;
      }
      
      if (currentTrainerId) {
        console.log("Client has current trainer set:", currentTrainerId);
        setSelectedTrainerId(currentTrainerId);
      }
      
      // If we have trainer IDs, fetch the trainer data
      if (trainerIds.length > 0) {
        const { trainers: trainersWithBranding, error: trainersError } = await fetchTrainersWithBranding(trainerIds);
        
        if (trainersError) {
          throw trainersError;
        }
        
        console.log("Final trainers with branding:", trainersWithBranding);
        setTrainers(trainersWithBranding);
        
        // Only try to select a trainer if the list has elements
        if (trainersWithBranding.length > 0) {
          // If no trainer selected, choose the first one
          if (!selectedTrainerId || selectedTrainerId === "") {
            console.log("No trainer selected, selecting first one:", trainersWithBranding[0].id);
            setTrainerDirectly(trainersWithBranding[0]);
          } else {
            // If there is a selected trainer, verify that it exists in the list
            console.log("Verifying selected trainer exists:", selectedTrainerId);
            const selectedTrainer = trainersWithBranding.find(t => t.id === selectedTrainerId);
            
            if (selectedTrainer) {
              console.log("Selected trainer found, applying theme:", selectedTrainer);
              setTrainerName(selectedTrainer.name);
              applyTrainerTheme(selectedTrainer, user?.email, toast);
            } else {
              // If the selected trainer is not in the list, choose the first one
              console.log("Selected trainer not found in data, selecting first one");
              setTrainerDirectly(trainersWithBranding[0]);
            }
          }
        } else {
          // No trainers available, use a default trainer
          console.log("No trainers available despite finding IDs, using default");
          setDefaultTrainerWithoutSelect();
        }
      } else {
        console.log("No trainer IDs available, setting default trainer");
        setDefaultTrainerWithoutSelect();
      }
    } catch (error: any) {
      console.error("Error loading trainers:", error);
      handleLoadError();
    } finally {
      setLoading(false);
    }
  };

  // Set trainer directly without calling handleTrainerSelect to avoid recursion
  const setTrainerDirectly = (trainer: Trainer) => {
    setSelectedTrainerId(trainer.id);
    setTrainerName(trainer.name);
    
    // Save to sessionStorage
    sessionStorage.setItem('selected_trainer_id', trainer.id);
    sessionStorage.setItem('selected_trainer_name', trainer.name);
    
    // Apply theme
    if (trainer.branding) {
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      applyTrainerThemeToDocument(trainer.branding);
    }
    
    // Notify trainer change if callback is provided
    if (onTrainerChange) {
      onTrainerChange(trainer.id, trainer.name, trainer.branding);
    }
  };

  // Create a default trainer when no client data is found
  const handleNoClientData = () => {
    const defaultTrainer = createDefaultTrainer("default-trainer", "Entrenador Predeterminado");
    
    setTrainers([defaultTrainer]);
    // Set trainer directly without calling handleTrainerSelect to avoid recursion
    setTrainerDirectly(defaultTrainer);
    
    toast({
      title: "Sin información de cliente",
      description: "No encontramos tus datos de cliente. Contacta a soporte o tu entrenador.",
      variant: "default"
    });
  };

  // Create a fallback trainer when no trainers are found
  const handleNoTrainersFound = () => {
    const fallbackTrainer = createDefaultTrainer("fallback-trainer", "Entrenador Predeterminado");
    
    setTrainers([fallbackTrainer]);
    // Set trainer directly without calling handleTrainerSelect to avoid recursion
    setTrainerDirectly(fallbackTrainer);
    
    toast({
      title: "No se encontraron entrenadores",
      description: "Contacta con soporte para asignar entrenadores",
      variant: "default"
    });
  };

  // Set default trainer directly without selecting it
  const setDefaultTrainerWithoutSelect = () => {
    console.log("Setting default demo trainer");
    const demoTrainer = createDefaultTrainer("demo-trainer", "Entrenador Demo");
    
    setTrainers([demoTrainer]);
    // Set the trainer directly
    setTrainerDirectly(demoTrainer);
  };

  // Create a fallback trainer when there's an error loading trainers
  const handleLoadError = () => {
    const fallbackTrainer = createDefaultTrainer("fallback-trainer", "Entrenador Predeterminado");
    
    setTrainers([fallbackTrainer]);
    // Set trainer directly
    setTrainerDirectly(fallbackTrainer);
    
    toast({
      title: "No se pudieron cargar entrenadores",
      description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
      variant: "destructive"
    });
  };

  // Handle trainer selection by the user
  const handleTrainerSelect = (trainerId: string) => {
    console.log("Trainer selected manually:", trainerId);
    
    // Check first if trainers list has elements
    if (trainers.length === 0) {
      console.log("No trainers available, cannot select trainer:", trainerId);
      return;
    }
    
    // Find the selected trainer
    const selected = trainers.find(t => t.id === trainerId);
    
    if (selected) {
      console.log("Selected trainer found, applying theme:", selected);
      setSelectedTrainerId(trainerId);
      setTrainerName(selected.name);
      
      applyTrainerTheme(selected, user?.email, toast);
      
      if (onTrainerChange) {
        onTrainerChange(selected.id, selected.name, selected.branding);
      }
    } else {
      // Clearer error message and recovery measure
      console.error("Selected trainer not found in trainers list:", trainerId, "Available trainers:", trainers);
      // If trainer not found but we have trainers in the list, use the first one
      if (trainers.length > 0) {
        console.log("Falling back to first available trainer");
        const firstTrainer = trainers[0];
        setSelectedTrainerId(firstTrainer.id);
        setTrainerName(firstTrainer.name);
        applyTrainerTheme(firstTrainer, user?.email, toast);
      }
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
