
import { useEffect, useState } from "react";
import { Trainer } from "@/components/client/dashboard/types";

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
    
    // Directly set the CSS variables with !important to ensure they override any other styles
    document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
    document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
    document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
    
    // Also update the root's class to force a re-render of components that depend on theme variables
    document.documentElement.classList.remove('theme-applied');
    setTimeout(() => {
      document.documentElement.classList.add('theme-applied');
    }, 0);
    
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
    applyThemeToDocument
  };
};
