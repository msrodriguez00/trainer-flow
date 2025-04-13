
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  const { currentTheme } = useTrainerTheme();
  
  // Debug for theme variables
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
    
    // Also force re-application of theme to ensure it's applied
    const storedBranding = sessionStorage.getItem('selected_trainer_branding');
    if (storedBranding) {
      try {
        const branding = JSON.parse(storedBranding);
        document.documentElement.style.setProperty('--client-primary', branding.primary_color, 'important');
        document.documentElement.style.setProperty('--client-secondary', branding.secondary_color, 'important');
        document.documentElement.style.setProperty('--client-accent', branding.accent_color, 'important');
      } catch (e) {
        console.error("Error applying theme from session storage", e);
      }
    }
    
    // Also log after a short delay to ensure CSS has been applied
    const timer = setTimeout(() => {
      logThemeVariables();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Visual indicator of theme colors */}
        <div className="hidden">
          <span className="bg-primary text-primary-foreground"></span>
          <span className="bg-secondary text-secondary-foreground"></span>
          <span className="bg-accent text-accent-foreground"></span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
