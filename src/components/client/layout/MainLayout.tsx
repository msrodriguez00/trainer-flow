
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  
  // Apply dynamic branding when the component mounts
  useEffect(() => {
    // Try to get and apply trainer branding from session storage
    const branding = sessionStorage.getItem('selected_trainer_branding');
    if (branding) {
      try {
        const brandingData = JSON.parse(branding);
        if (brandingData) {
          document.documentElement.style.setProperty('--client-primary', brandingData.primary_color || '#9b87f5');
          document.documentElement.style.setProperty('--client-secondary', brandingData.secondary_color || '#E5DEFF');
          document.documentElement.style.setProperty('--client-accent', brandingData.accent_color || '#7E69AB');
        }
      } catch (error) {
        console.error("Error parsing trainer branding:", error);
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
