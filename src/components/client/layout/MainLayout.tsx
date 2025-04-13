
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth"; 
import Navbar from "@/components/Navbar";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  const { } = useTrainerTheme(); // This will trigger the useEffect in useTrainerTheme
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
