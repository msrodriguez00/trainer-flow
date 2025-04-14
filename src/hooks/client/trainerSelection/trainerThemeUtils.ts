
import { Trainer } from "@/components/client/dashboard/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Apply theme directly to document
export const applyTrainerThemeToDocument = (branding: any): void => {
  document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
  document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
  document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
  
  // Force re-rendering of components that use the theme
  document.documentElement.classList.remove('theme-applied');
  setTimeout(() => document.documentElement.classList.add('theme-applied'), 10);
};

// Apply trainer theme to database and document
export const applyTrainerTheme = async (
  trainer: Trainer, 
  userEmail: string | undefined | null,
  toast: ReturnType<typeof useToast>["toast"]
): Promise<boolean> => {
  console.log("Applying trainer theme to client database:", trainer);
  if (!trainer.branding || !userEmail) return false;
  
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
      .eq("email", userEmail.toLowerCase());
      
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

// Create a default trainer object
export const createDefaultTrainer = (id: string, name: string): Trainer => {
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
