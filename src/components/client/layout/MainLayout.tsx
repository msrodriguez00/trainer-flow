
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  
  // This ensures the theme hook's useEffect runs on initial load
  // which will apply the theme from sessionStorage if it exists
  useTrainerTheme();
  
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
    
    // Also log after a short delay to ensure CSS has been applied
    const timer = setTimeout(() => {
      logThemeVariables();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
