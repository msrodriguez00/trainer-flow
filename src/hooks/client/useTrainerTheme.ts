
import { useEffect, useState } from "react";
import { Trainer } from "@/components/client/dashboard/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * A hook to manage trainer theme application
 */
export const useTrainerTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  
  // Load theme from session storage on initial mount
  useEffect(() => {
    try {
      const storedBranding = sessionStorage.getItem('selected_trainer_branding');
      if (storedBranding) {
        const branding = JSON.parse(storedBranding);
        applyThemeToDocument(branding);
        setCurrentTheme(branding);
        console.log("Initial theme loaded from session storage:", branding);
      } else {
        // If no theme in session storage, check if there's a selected trainer ID
        const selectedTrainerId = sessionStorage.getItem('selected_trainer_id');
        if (selectedTrainerId) {
          console.log("Found selected trainer ID but no branding, fetching theme:", selectedTrainerId);
          fetchTrainerTheme(selectedTrainerId);
        } else {
          // If no theme in session storage, apply default theme
          console.log("No theme in session storage or trainer ID, applying defaults");
          resetTheme();
        }
      }
    } catch (error) {
      console.error("Error loading trainer theme:", error);
      resetTheme();
    }
  }, []);

  // Fetch theme directly from the database
  const fetchTrainerTheme = async (trainerId: string) => {
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
      
      if (brandData) {
        console.log("Fetched trainer branding:", brandData);
        const branding = {
          primary_color: brandData.primary_color || "#9b87f5",
          secondary_color: brandData.secondary_color || "#E5DEFF",
          accent_color: brandData.accent_color || "#7E69AB",
          logo_url: brandData.logo_url
        };
        
        sessionStorage.setItem('selected_trainer_branding', JSON.stringify(branding));
        applyThemeToDocument(branding);
        setCurrentTheme(branding);
        return true;
      } else {
        console.log("No branding data found for trainer:", trainerId);
        resetTheme();
        return false;
      }
    } catch (error) {
      console.error("Error in fetchTrainerTheme:", error);
      resetTheme();
      return false;
    }
  };

  // Apply theme to document
  const applyThemeToDocument = (branding: any) => {
    console.log("Applying theme to document:", branding);
    
    // Directly set the CSS variables with !important to ensure they override any other styles
    document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
    document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
    
    // Also update the root's class to force a re-render of components that depend on theme variables
    document.documentElement.classList.remove('theme-applied');
    setTimeout(() => {
      document.documentElement.classList.add('theme-applied');
    }, 10);
    
    // Log current theme values after setting
    console.log("Current CSS variable values:", {
      primary: getComputedStyle(document.documentElement).getPropertyValue('--client-primary'),
      secondary: getComputedStyle(document.documentElement).getPropertyValue('--client-secondary'),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--client-accent')
    });
  };

  // Apply a trainer's theme
  const applyTrainerTheme = (trainer: Trainer) => {
    if (trainer.branding) {
      console.log("Setting trainer theme:", trainer.name, trainer.branding);
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      applyThemeToDocument(trainer.branding);
      setCurrentTheme(trainer.branding);
      
      toast.success(`Tema de ${trainer.name} aplicado`, {
        description: "El tema personalizado del entrenador ha sido aplicado."
      });
      return true;
    }
    return false;
  };

  // Reset theme to defaults
  const resetTheme = () => {
    const defaultTheme = {
      primary_color: "#9b87f5",
      secondary_color: "#E5DEFF",
      accent_color: "#7E69AB"
    };
    
    console.log("Resetting theme to defaults:", defaultTheme);
    applyThemeToDocument(defaultTheme);
    setCurrentTheme(defaultTheme);
    sessionStorage.removeItem('selected_trainer_branding');
  };

  return {
    currentTheme,
    applyTrainerTheme,
    resetTheme,
    applyThemeToDocument,
    fetchTrainerTheme
  };
};
