
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";
import { toast } from "sonner";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  const { currentTheme, resetTheme } = useTrainerTheme();
  
  // Apply and verify theme on initial load
  useEffect(() => {
    const logThemeVariables = () => {
      const root = document.documentElement;
      console.log("Current theme variables:", {
        primary: getComputedStyle(root).getPropertyValue('--client-primary'),
        secondary: getComputedStyle(root).getPropertyValue('--client-secondary'),
        accent: getComputedStyle(root).getPropertyValue('--client-accent')
      });
    };
    
    // Log on initial mount
    logThemeVariables();
    
    // Force re-application of theme to ensure it's applied
    const storedBranding = sessionStorage.getItem('selected_trainer_branding');
    if (storedBranding) {
      try {
        const branding = JSON.parse(storedBranding);
        document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
        document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
        document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
        
        // Add theme-applied class to force re-render of components
        document.documentElement.classList.remove('theme-applied');
        setTimeout(() => {
          document.documentElement.classList.add('theme-applied');
        }, 10);
        
        toast.success("Tema personalizado aplicado", {
          description: "Se ha aplicado el tema personalizado de tu entrenador."
        });
      } catch (e) {
        console.error("Error applying theme from session storage", e);
        resetTheme();
        toast.error("Error al aplicar tema", {
          description: "Se ha aplicado el tema predeterminado."
        });
      }
    }
    
    // Also log after a short delay to ensure CSS has been applied
    const timer = setTimeout(() => {
      logThemeVariables();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [resetTheme]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Visual indicator of theme colors */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-1 p-2 bg-white/80 backdrop-blur rounded-md shadow-md border border-gray-200 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-primary"></span>
            <span className="text-xs font-medium">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-secondary"></span>
            <span className="text-xs font-medium">Secondary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-accent"></span>
            <span className="text-xs font-medium">Accent</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
