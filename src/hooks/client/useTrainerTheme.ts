
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
        console.log("Initial theme loaded from session storage:", branding);
      } else {
        // If no theme in session storage, apply default theme
        console.log("No theme in session storage, applying defaults");
        resetTheme();
      }
    } catch (error) {
      console.error("Error loading trainer theme:", error);
      resetTheme();
    }
  }, []);

  // Apply theme to document
  const applyThemeToDocument = (branding: any) => {
    console.log("Applying theme to document:", branding);
    
    // Directly set the CSS variables
    document.documentElement.style.setProperty('--client-primary', branding.primary_color);
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color);
    document.documentElement.style.setProperty('--client-accent', branding.accent_color);
    
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
    sessionStorage.removeItem('selected_trainer_branding');
  };

  return {
    applyTrainerTheme,
    resetTheme
  };
};
