
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type ClientTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  trainerId: string | null;
};

export const useClientTheme = () => {
  const [clientTheme, setClientTheme] = useState<ClientTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load client theme from database on initial mount
  useEffect(() => {
    if (!user?.email) return;
    
    const fetchClientTheme = async () => {
      try {
        setIsLoading(true);
        
        const { data: clientData, error } = await supabase
          .from("clients")
          .select(`
            current_theme_primary_color,
            current_theme_secondary_color,
            current_theme_accent_color,
            current_theme_logo_url,
            current_trainer_id
          `)
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
          
        if (error) throw error;
        
        if (clientData) {
          const theme = {
            primaryColor: clientData.current_theme_primary_color || '#9b87f5',
            secondaryColor: clientData.current_theme_secondary_color || '#E5DEFF',
            accentColor: clientData.current_theme_accent_color || '#7E69AB',
            logoUrl: clientData.current_theme_logo_url,
            trainerId: clientData.current_trainer_id
          };
          
          console.log("Loaded client theme from DB:", theme);
          setClientTheme(theme);
          applyThemeToDocument(theme);
        } else {
          console.log("No client theme found in database");
          // Apply default theme
          const defaultTheme = {
            primaryColor: '#9b87f5',
            secondaryColor: '#E5DEFF',
            accentColor: '#7E69AB',
            logoUrl: null,
            trainerId: null
          };
          setClientTheme(defaultTheme);
          applyThemeToDocument(defaultTheme);
        }
      } catch (error) {
        console.error("Error loading client theme:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar el tema",
          description: "No se pudo cargar tu tema personalizado. Se ha aplicado el tema predeterminado."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientTheme();
  }, [user, toast]);

  // Apply theme to document
  const applyThemeToDocument = (theme: ClientTheme) => {
    document.documentElement.style.setProperty('--client-primary', theme.primaryColor, 'important');
    document.documentElement.style.setProperty('--client-secondary', theme.secondaryColor, 'important');
    document.documentElement.style.setProperty('--client-accent', theme.accentColor, 'important');
    
    // Trigger re-render of components that use the theme
    document.documentElement.classList.remove('theme-applied');
    setTimeout(() => document.documentElement.classList.add('theme-applied'), 10);
  };

  // Update client theme in the database
  const updateClientTheme = async (theme: ClientTheme) => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      
      console.log("Updating client theme in DB:", theme);
      const { error } = await supabase
        .from("clients")
        .update({
          current_theme_primary_color: theme.primaryColor,
          current_theme_secondary_color: theme.secondaryColor,
          current_theme_accent_color: theme.accentColor,
          current_theme_logo_url: theme.logoUrl,
          current_trainer_id: theme.trainerId
        })
        .eq("email", user.email.toLowerCase());
        
      if (error) throw error;
      
      setClientTheme(theme);
      applyThemeToDocument(theme);
      
      toast({
        title: "Tema actualizado",
        description: "Tu tema personalizado ha sido actualizado."
      });
      
      return true;
    } catch (error) {
      console.error("Error updating client theme:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar el tema",
        description: "No se pudo guardar tu tema personalizado."
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset theme to defaults
  const resetTheme = async () => {
    const defaultTheme = {
      primaryColor: '#9b87f5',
      secondaryColor: '#E5DEFF',
      accentColor: '#7E69AB',
      logoUrl: null,
      trainerId: null
    };
    
    await updateClientTheme(defaultTheme);
  };

  return {
    clientTheme,
    isLoading,
    updateClientTheme,
    applyThemeToDocument,
    resetTheme
  };
};
