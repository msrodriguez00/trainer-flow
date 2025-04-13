
import { useEffect, useState, useRef } from "react";
import { Trainer } from "@/components/client/dashboard/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * A hook to manage trainer theme application
 */
export const useTrainerTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const themeInitializedRef = useRef(false);
  
  // Load theme from session storage on initial mount with error handling
  useEffect(() => {
    // Skip if we've already initialized
    if (themeInitializedRef.current) return;
    themeInitializedRef.current = true;
    
    try {
      console.log("useTrainerTheme: Initializing");
      
      const storedBranding = sessionStorage.getItem('selected_trainer_branding');
      const selectedTrainerId = sessionStorage.getItem('selected_trainer_id');
      
      console.log("Initial stored values:", { 
        storedBranding: storedBranding ? "exists" : "none", 
        selectedTrainerId 
      });
      
      if (storedBranding) {
        try {
          const branding = JSON.parse(storedBranding);
          console.log("Applying theme from session storage:", branding);
          applyThemeToDocument(branding);
          setCurrentTheme(branding);
        } catch (parseError) {
          console.error("Error parsing stored branding:", parseError);
          // If parsing fails, try to fetch fresh data
          if (selectedTrainerId) {
            fetchTrainerTheme(selectedTrainerId);
          } else {
            resetTheme();
          }
        }
      } else if (selectedTrainerId) {
        console.log("No branding in session but trainer ID exists, fetching theme:", selectedTrainerId);
        fetchTrainerTheme(selectedTrainerId);
      } else {
        console.log("No theme data available, applying defaults");
        resetTheme();
      }
    } catch (error) {
      console.error("Error initializing trainer theme:", error);
      resetTheme();
    }
  }, []);

  // Fetch theme directly from the database with better error handling
  const fetchTrainerTheme = async (trainerId: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching theme for trainer:", trainerId);
      const { data: brandData, error } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", trainerId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching trainer branding:", error);
        throw error;
      }
      
      console.log("Trainer branding data fetched:", brandData);
      
      if (brandData) {
        const branding = {
          primary_color: brandData.primary_color || "#9b87f5",
          secondary_color: brandData.secondary_color || "#E5DEFF",
          accent_color: brandData.accent_color || "#7E69AB",
          logo_url: brandData.logo_url
        };
        
        console.log("Saving and applying branding:", branding);
        sessionStorage.setItem('selected_trainer_branding', JSON.stringify(branding));
        applyThemeToDocument(branding);
        setCurrentTheme(branding);
        
        toast({
          title: "Tema personalizado aplicado",
          description: "El tema personalizado del entrenador ha sido aplicado."
        });
        return true;
      } else {
        console.log("No branding data found for trainer:", trainerId);
        resetTheme();
        return false;
      }
    } catch (error) {
      console.error("Error in fetchTrainerTheme:", error);
      resetTheme();
      
      toast({
        variant: "destructive",
        title: "Error al cargar el tema",
        description: "No se pudo cargar el tema del entrenador. Se ha aplicado el tema predeterminado."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply theme to document with forced re-rendering
  const applyThemeToDocument = (branding: any) => {
    console.log("Applying theme with !important:", branding);
    
    // Force the CSS variables with !important to ensure they override any other styles
    document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
    document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
    
    // Add theme-applied class to force a re-render of components
    document.documentElement.classList.remove('theme-applied');
    setTimeout(() => {
      document.documentElement.classList.add('theme-applied');
      
      // Log verification of applied values
      console.log("Theme should now be applied. Verifying CSS variables:");
      const root = document.documentElement;
      console.log({
        primary: getComputedStyle(root).getPropertyValue('--client-primary'),
        secondary: getComputedStyle(root).getPropertyValue('--client-secondary'),
        accent: getComputedStyle(root).getPropertyValue('--client-accent')
      });
    }, 10);
  };

  // Apply a trainer's theme with explicit error handling
  const applyTrainerTheme = (trainer: Trainer) => {
    if (!trainer) {
      console.error("Cannot apply theme - trainer object is null or undefined");
      return false;
    }
    
    try {
      if (trainer.branding) {
        console.log("Applying trainer theme for:", trainer.name, trainer.branding);
        sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
        applyThemeToDocument(trainer.branding);
        setCurrentTheme(trainer.branding);
        
        toast({
          title: `Tema de ${trainer.name} aplicado`,
          description: "El tema personalizado del entrenador ha sido aplicado."
        });
        return true;
      } else if (trainer.id) {
        // If trainer exists but has no branding, try to fetch it
        console.log("Trainer has no branding object, fetching from DB:", trainer.id);
        return fetchTrainerTheme(trainer.id);
      }
    } catch (error) {
      console.error("Error applying trainer theme:", error);
      toast({
        variant: "destructive",
        title: "Error al aplicar el tema",
        description: "No se pudo aplicar el tema personalizado. Se ha aplicado el tema predeterminado."
      });
      resetTheme();
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
    
    console.log("Resetting to default theme:", defaultTheme);
    applyThemeToDocument(defaultTheme);
    setCurrentTheme(defaultTheme);
    sessionStorage.removeItem('selected_trainer_branding');
    
    toast({
      title: "Tema predeterminado aplicado",
      description: "Se ha aplicado el tema predeterminado."
    });
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
