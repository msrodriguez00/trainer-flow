
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/client/layout/MainLayout";
import WelcomeHeader from "@/components/client/dashboard/WelcomeHeader";
import InvitationsSection from "@/components/client/dashboard/InvitationsSection";
import TrainingPlansList from "@/components/client/dashboard/TrainingPlansList";
import ActivityCalendar from "@/components/client/dashboard/ActivityCalendar";
import LoadingScreen from "@/components/client/common/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isClient } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Redirect non-clients to main page
  useEffect(() => {
    if (!isLoading && !isClient) {
      navigate("/");
    }
  }, [isLoading, isClient, navigate]);

  // Debug para ver si estamos cargando la página correctamente
  useEffect(() => {
    console.log("ClientDashboard rendering", { 
      isLoading, 
      isClient, 
      profile,
      user: user ? {
        id: user.id,
        email: user.email,
      } : null
    });
  }, [isLoading, isClient, profile, user]);

  // Manejador para cambios de entrenador
  const handleTrainerChange = (trainerId: string, trainerName: string, trainerBranding?: any) => {
    console.log("Entrenador seleccionado:", trainerName, "ID:", trainerId, "Branding:", trainerBranding);
    toast({
      title: "Entrenador seleccionado",
      description: `Has seleccionado a ${trainerName} como tu entrenador actual.`,
    });
    // Aquí podríamos cargar datos específicos del entrenador si fuera necesario
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Welcome header with user info and trainer selector */}
          <WelcomeHeader 
            userName={profile?.name || "Cliente"} 
            userEmail={user?.email || ""} 
            onTrainerChange={handleTrainerChange}
          />
          
          {/* Trainer invitations section */}
          <InvitationsSection />
          
          {/* Main content - two column layout on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ActivityCalendar 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
              className="md:col-span-2"
            />
            
            <TrainingPlansList />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientDashboard;
