
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trainer } from "@/components/client/dashboard/types";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setLoading(true);
    console.log("useTrainerSelection: Loading trainers");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        console.error("No user email available");
        throw new Error("No se pudo determinar el usuario actual");
      }
      
      console.log("Loading trainers for user email:", user.email);
      
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select(`
          *,
          current_trainer_id
        `)
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
      
      // Check if client has a current trainer set
      if (clientData.current_trainer_id) {
        console.log("Client has current trainer set:", clientData.current_trainer_id);
        setSelectedTrainerId(clientData.current_trainer_id);
      }
      
      let trainerIds: string[] = [];
      
      if (clientData.trainers && clientData.trainers.length > 0) {
        trainerIds = clientData.trainers;
      } else if (clientData.trainer_id) {
        trainerIds = [clientData.trainer_id];
      }
      
      console.log("Trainer IDs from client data:", trainerIds);
      
      if (trainerIds.length > 0) {
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
        
        // Solo intentar seleccionar un entrenador si la lista tiene elementos
        if (trainersWithBranding.length > 0) {
          // Si no hay entrenador seleccionado, elegir el primero
          if (!selectedTrainerId || selectedTrainerId === "") {
            console.log("No trainer selected, selecting first one:", trainersWithBranding[0].id);
            handleTrainerSelect(trainersWithBranding[0].id);
          } else {
            // Si hay un entrenador seleccionado, verificar que exista en la lista
            console.log("Verifying selected trainer exists:", selectedTrainerId);
            const selectedTrainer = trainersWithBranding.find(t => t.id === selectedTrainerId);
            
            if (selectedTrainer) {
              console.log("Selected trainer found, applying theme:", selectedTrainer);
              applyTrainerTheme(selectedTrainer);
            } else {
              // Si el entrenador seleccionado no está en la lista, elegir el primero
              console.log("Selected trainer not found in data, selecting first one");
              handleTrainerSelect(trainersWithBranding[0].id);
            }
          }
        } else {
          // No hay entrenadores disponibles, usar un entrenador por defecto
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
    // Establecer directamente el trainer sin llamar a handleTrainerSelect
    setTrainerDirectly(defaultTrainer);
    
    toast({
      title: "Sin información de cliente",
      description: "No encontramos tus datos de cliente. Contacta a soporte o tu entrenador.",
      variant: "default"
    });
  };

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
    // Establecer directamente el trainer sin llamar a handleTrainerSelect
    setTrainerDirectly(fallbackTrainer);
    
    toast({
      title: "No se encontraron entrenadores",
      description: "Contacta con soporte para asignar entrenadores",
      variant: "default"
    });
  };

  // Nueva función para establecer el entrenador predeterminado directamente sin seleccionarlo
  const setDefaultTrainerWithoutSelect = () => {
    console.log("Setting default demo trainer directly");
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
    // Establecer directamente el trainer sin llamar a handleTrainerSelect
    setTrainerDirectly(demoTrainer);
  };

  // Función para establecer un entrenador directamente
  const setTrainerDirectly = (trainer: Trainer) => {
    setSelectedTrainerId(trainer.id);
    setTrainerName(trainer.name);
    
    // Guardar en sessionStorage
    sessionStorage.setItem('selected_trainer_id', trainer.id);
    sessionStorage.setItem('selected_trainer_name', trainer.name);
    
    // Aplicar tema
    if (trainer.branding) {
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      applyTrainerThemeToDocument(trainer.branding);
    }
    
    // Notificar cambio de entrenador si hay callback
    if (onTrainerChange) {
      onTrainerChange(trainer.id, trainer.name, trainer.branding);
    }
  };

  // Función auxiliar para aplicar tema directamente al documento
  const applyTrainerThemeToDocument = (branding: any) => {
    document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
    document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
    
    // Forzar re-renderizado de componentes que usan el tema
    document.documentElement.classList.remove('theme-applied');
    setTimeout(() => document.documentElement.classList.add('theme-applied'), 10);
  };

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
    // Establecer directamente el trainer sin llamar a handleTrainerSelect
    setTrainerDirectly(fallbackTrainer);
    
    toast({
      title: "No se pudieron cargar entrenadores",
      description: "Estamos experimentando dificultades técnicas. Por favor, inténtalo más tarde.",
      variant: "destructive"
    });
  };

  const applyTrainerTheme = async (trainer: Trainer) => {
    console.log("Applying trainer theme to client database:", trainer);
    if (!trainer.branding || !user?.email) return false;
    
    try {
      // Save theme to session storage for current session
      sessionStorage.setItem('selected_trainer_id', trainer.id);
      sessionStorage.setItem('selected_trainer_name', trainer.name);
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      
      // Save theme to database for persistence
      const { error } = await supabase
        .from("clients")
        .update({
          current_theme_primary_color: trainer.branding.primary_color,
          current_theme_secondary_color: trainer.branding.secondary_color,
          current_theme_accent_color: trainer.branding.accent_color,
          current_theme_logo_url: trainer.branding.logo_url,
          current_trainer_id: trainer.id
        })
        .eq("email", user.email.toLowerCase());
        
      if (error) {
        console.error("Error saving theme to database:", error);
        throw error;
      }
      
      // Apply theme to CSS variables
      applyTrainerThemeToDocument(trainer.branding);
      
      toast({
        title: `Tema de ${trainer.name} aplicado`,
        description: "El tema personalizado del entrenador ha sido aplicado y guardado."
      });
      
      return true;
    } catch (error) {
      console.error("Error applying trainer theme:", error);
      toast({
        variant: "destructive",
        title: "Error al aplicar el tema",
        description: "No se pudo guardar el tema personalizado en la base de datos."
      });
      return false;
    }
  };

  const handleTrainerSelect = (trainerId: string) => {
    console.log("Trainer selected manually:", trainerId);
    
    // verificar primero si la lista de entrenadores tiene elementos
    if (trainers.length === 0) {
      console.log("No trainers available, cannot select trainer:", trainerId);
      return; // No llamar a setDefaultTrainerWithoutSelect para evitar recursión
    }
    
    // Buscar el entrenador seleccionado
    const selected = trainers.find(t => t.id === trainerId);
    
    if (selected) {
      console.log("Selected trainer found, applying theme:", selected);
      setSelectedTrainerId(trainerId);
      setTrainerName(selected.name);
      
      const success = applyTrainerTheme(selected);
      console.log("Theme application result:", success);
      
      if (onTrainerChange) {
        onTrainerChange(selected.id, selected.name, selected.branding);
      }
    } else {
      // Mensaje de error más claro y medida de recuperación
      console.error("Selected trainer not found in trainers list:", trainerId, "Available trainers:", trainers);
      // Si no encontramos el entrenador pero tenemos alguno en la lista, usar el primero
      if (trainers.length > 0) {
        console.log("Falling back to first available trainer");
        const firstTrainer = trainers[0];
        setSelectedTrainerId(firstTrainer.id);
        setTrainerName(firstTrainer.name);
        applyTrainerTheme(firstTrainer);
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
