
import { useEffect } from "react";
import { Trainer } from "@/components/client/dashboard/types";

/**
 * A hook to manage trainer theme application
 * This could be further extracted from the useTrainerSelection hook
 * to separate theme concerns
 */
export const useTrainerTheme = () => {
  // Load theme from session storage on initial mount
  useEffect(() => {
    try {
      const storedBranding = sessionStorage.getItem('selected_trainer_branding');
      if (storedBranding) {
        const branding = JSON.parse(storedBranding);
        applyThemeToDocument(branding);
      }
    } catch (error) {
      console.error("Error loading trainer theme:", error);
    }
  }, []);

  // Apply theme to document
  const applyThemeToDocument = (branding: any) => {
    document.documentElement.style.setProperty('--client-primary', branding.primary_color);
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color);
    document.documentElement.style.setProperty('--client-accent', branding.accent_color);
  };

  // Apply a trainer's theme
  const applyTrainerTheme = (trainer: Trainer) => {
    if (trainer.branding) {
      sessionStorage.setItem('selected_trainer_branding', JSON.stringify(trainer.branding));
      applyThemeToDocument(trainer.branding);
    }
  };

  // Reset theme to defaults
  const resetTheme = () => {
    const defaultTheme = {
      primary_color: "#9b87f5",
      secondary_color: "#E5DEFF",
      accent_color: "#7E69AB"
    };
    
    applyThemeToDocument(defaultTheme);
    sessionStorage.removeItem('selected_trainer_branding');
  };

  return {
    applyTrainerTheme,
    resetTheme
  };
};
