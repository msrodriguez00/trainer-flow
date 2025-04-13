
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
        {/* Visual indicator of theme colors */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-1 p-2 bg-white/80 backdrop-blur rounded-md shadow-md border border-gray-200 z-50 opacity-50 hover:opacity-100 transition-opacity">
          <div className="text-xs font-medium mb-1">
            {themeVerified ? "✅ Tema verificado" : "⏳ Verificando tema..."}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--client-primary)] border border-gray-300"></span>
            <span className="text-xs font-medium">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--client-secondary)] border border-gray-300"></span>
            <span className="text-xs font-medium">Secondary</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[var(--client-accent)] border border-gray-300"></span>
            <span className="text-xs font-medium">Accent</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
