
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerSelector from "./TrainerSelector";
import { useTrainerSelection } from "@/hooks/client/useTrainerSelection";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

const WelcomeHeader = ({ userName, userEmail, onTrainerChange }: WelcomeHeaderProps) => {
  const { user } = useAuth();
  const {
    trainers,
    loading,
    selectedTrainerId,
    handleTrainerSelect
  } = useTrainerSelection(onTrainerChange);

  // Debug logging para verificar que los temas se están aplicando
  useEffect(() => {
    const storedBranding = sessionStorage.getItem('selected_trainer_branding');
    console.log("WelcomeHeader - stored branding:", storedBranding ? JSON.parse(storedBranding) : null);
    
    // Verify CSS variables
    console.log("WelcomeHeader CSS variables:", {
      primary: getComputedStyle(document.documentElement).getPropertyValue('--client-primary'),
      secondary: getComputedStyle(document.documentElement).getPropertyValue('--client-secondary'),
      accent: getComputedStyle(document.documentElement).getPropertyValue('--client-accent')
    });
  }, []);

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-2 bg-secondary/50">
        <CardTitle className="text-2xl text-primary">¡Bienvenido, {userName}!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">{userEmail}</p>
          
          <TrainerSelector
            trainers={trainers}
            selectedTrainerId={selectedTrainerId}
            loading={loading}
            onTrainerSelect={handleTrainerSelect}
          />
          
          {/* Add a visual indicator for theme testing */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span>Theme test:</span>
            <div className="w-6 h-6 rounded-full bg-primary"></div>
            <div className="w-6 h-6 rounded-full bg-secondary"></div>
            <div className="w-6 h-6 rounded-full bg-accent"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
