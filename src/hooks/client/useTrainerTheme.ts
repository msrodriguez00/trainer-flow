
import { useEffect, useState, useRef } from "react";
import { Trainer } from "@/components/client/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Un hook para gestionar la aplicación del tema del entrenador
 */
export const useTrainerTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const themeInitializedRef = useRef(false);
  
  // Cargar tema desde el almacenamiento de la sesión en el montaje inicial con manejo de errores
  useEffect(() => {
    // Omitir si ya hemos inicializado
    if (themeInitializedRef.current) return;
    themeInitializedRef.current = true;
    
    try {
      console.log("useTrainerTheme: Inicializando");
      
      const storedBranding = sessionStorage.getItem('selected_trainer_branding');
      const selectedTrainerId = sessionStorage.getItem('selected_trainer_id');
      
      console.log("Valores almacenados iniciales:", { 
        storedBranding: storedBranding ? "existe" : "ninguno", 
        selectedTrainerId 
      });
      
      if (storedBranding) {
        try {
          const branding = JSON.parse(storedBranding);
          console.log("Aplicando tema desde el almacenamiento de sesión:", branding);
          applyThemeToDocument(branding);
          setCurrentTheme(branding);
        } catch (parseError) {
          console.error("Error al analizar la marca almacenada:", parseError);
          // Si el análisis falla, intenta obtener datos nuevos
          if (selectedTrainerId) {
            fetchTrainerTheme(selectedTrainerId);
          }
        }
      } else if (selectedTrainerId) {
        console.log("No hay marca en la sesión pero existe el ID del entrenador, obteniendo tema:", selectedTrainerId);
        fetchTrainerTheme(selectedTrainerId);
      }
    } catch (error) {
      console.error("Error al inicializar el tema del entrenador:", error);
    }
  }, []);

  // Fetch theme directly from the database with better error handling
  const fetchTrainerTheme = async (trainerId: string) => {
    setIsLoading(true);
    try {
      console.log("Obteniendo tema para el entrenador:", trainerId);
      const { data: brandData, error } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", trainerId)
        .maybeSingle();
      
      if (error) {
        console.error("Error al obtener la marca del entrenador:", error);
        throw error;
      }
      
      console.log("Datos de marca del entrenador obtenidos:", brandData);
      
      if (brandData) {
        const branding = {
          primary_color: brandData.primary_color || "#9b87f5",
          secondary_color: brandData.secondary_color || "#E5DEFF",
          accent_color: brandData.accent_color || "#7E69AB",
          logo_url: brandData.logo_url
        };
        
        console.log("Guardando y aplicando marca:", branding);
        sessionStorage.setItem('selected_trainer_branding', JSON.stringify(branding));
        applyThemeToDocument(branding);
        setCurrentTheme(branding);
        return true;
      } else {
        console.log("No se encontraron datos de marca para el entrenador:", trainerId);
        return false;
      }
    } catch (error) {
      console.error("Error en fetchTrainerTheme:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply theme to document with forced re-rendering
  const applyThemeToDocument = (branding: any) => {
    console.log("Aplicando tema con !important:", branding);
    
    // Forzar las variables CSS con !important para asegurar que sobreescriban cualquier otro estilo
    document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
    document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
  };

  // Apply a trainer's theme with explicit error handling
  const applyTrainerTheme = (trainer: Trainer) => {
    if (!trainer) {
      console.error("No se puede aplicar el tema - el objeto del entrenador es nulo o indefinido");
      return false;
    }
    
    try {
      if (trainer.branding) {
        console.log("Aplicando tema del entrenador para:", trainer.name, trainer.branding);
        sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
        applyThemeToDocument(trainer.branding);
        setCurrentTheme(trainer.branding);
        
        toast({
          title: `Tema de ${trainer.name} aplicado`,
          description: "El tema personalizado del entrenador ha sido aplicado."
        });
        return true;
      } else if (trainer.id) {
        // Si el entrenador existe pero no tiene marca, intenta obtenerla
        console.log("El entrenador no tiene objeto de marca, obteniendo de la BD:", trainer.id);
        return fetchTrainerTheme(trainer.id);
      }
    } catch (error) {
      console.error("Error al aplicar el tema del entrenador:", error);
      toast({
        variant: "destructive",
        title: "Error al aplicar el tema",
        description: "No se pudo aplicar el tema personalizado."
      });
    }
    return false;
  };

  // Reset theme to defaults with notification
  const resetTheme = () => {
    const defaultTheme = {
      primary_color: "#9b87f5",
      secondary_color: "#E5DEFF",
      accent_color: "#7E69AB"
    };
    
    console.log("Restableciendo al tema predeterminado:", defaultTheme);
    applyThemeToDocument(defaultTheme);
    setCurrentTheme(defaultTheme);
    sessionStorage.removeItem('selected_trainer_branding');
  };

  return {
    currentTheme,
    applyTrainerTheme,
    resetTheme,
    applyThemeToDocument,
    fetchTrainerTheme,
    isLoading
  };
};
