
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useClientTheme } from "@/hooks/client/useClientTheme";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  const { clientTheme, isLoading } = useClientTheme();
  const [themeVerified, setThemeVerified] = useState(false);
  
  useEffect(() => {
    // Set themeVerified when theme is loaded
    if (!isLoading && clientTheme) {
      setThemeVerified(true);
    }
  }, [isLoading, clientTheme]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

