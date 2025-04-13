
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  const { currentTheme, fetchTrainerTheme, resetTheme } = useTrainerTheme();
  const { toast } = useToast();
  const [themeVerified, setThemeVerified] = useState(false);
  
  // Apply and verify theme on initial load
  useEffect(() => {
    const verifyAndApplyTheme = async () => {
      console.log("MainLayout: Verifying theme");
      
      // Log current theme state
      const logThemeVariables = () => {
        const root = document.documentElement;
        const computedStyles = {
          primary: getComputedStyle(root).getPropertyValue('--client-primary'),
          secondary: getComputedStyle(root).getPropertyValue('--client-secondary'),
          accent: getComputedStyle(root).getPropertyValue('--client-accent')
        };
        
        console.log("Current theme variables:", computedStyles);
        return computedStyles;
      };
      
      // Initial log
      logThemeVariables();
      
      try {
        // Check if we have a selected trainer
        const trainerId = sessionStorage.getItem('selected_trainer_id');
        
        if (trainerId) {
          // Try to apply theme from session storage first
          const storedBranding = sessionStorage.getItem('selected_trainer_branding');
          
          if (storedBranding) {
            try {
              console.log("Found stored branding, applying:", storedBranding);
              const branding = JSON.parse(storedBranding);
              
              // Apply theme with !important flag for CSS variables
              document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
              document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
              document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
              
              // Force re-render of styled components
              document.documentElement.classList.remove('theme-applied');
              setTimeout(() => document.documentElement.classList.add('theme-applied'), 10);
              
            } catch (e) {
              console.error("Error parsing stored branding:", e);
              
              // Fetch fresh theme data if parsing fails
              await fetchTrainerTheme(trainerId);
            }
          } else {
            // No stored theme data, fetch from database
            console.log("No stored branding found, fetching from DB for trainer:", trainerId);
            await fetchTrainerTheme(trainerId);
          }
        } else {
          // No trainer selected, use default theme
          console.log("No trainer selected, using default theme");
          resetTheme();
        }
      } catch (e) {
        console.error("Error verifying theme:", e);
        resetTheme();
      } finally {
        // Final log to verify application
        const finalStyles = logThemeVariables();
        
        // Check if theme is actually applied
        const primary = finalStyles.primary.trim();
        if (!primary || primary === "undefined" || primary === "null") {
          console.warn("Theme variables not properly applied, forcing reset");
          resetTheme();
        }
        
        setThemeVerified(true);
      }
    };
    
    verifyAndApplyTheme();
  }, [fetchTrainerTheme, resetTheme]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Visual indicator of theme colors */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-1 p-2 bg-white/80 backdrop-blur rounded-md shadow-md border border-gray-200 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div className="text-xs font-medium mb-1">
            {themeVerified ? "✅ Tema verificado" : "⏳ Verificando tema..."}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-primary border border-gray-300"></span>
            <span className="text-xs font-medium">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-secondary border border-gray-300"></span>
            <span className="text-xs font-medium">Secondary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-accent border border-gray-300"></span>
            <span className="text-xs font-medium">Accent</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
