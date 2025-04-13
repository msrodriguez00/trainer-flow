
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerSelector from "./TrainerSelector";
import { useTrainerSelection } from "@/hooks/client/useTrainerSelection";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

const WelcomeHeader = ({ userName, userEmail, onTrainerChange }: WelcomeHeaderProps) => {
  const { user } = useAuth();
  const { currentTheme } = useTrainerTheme();
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
    
    // Verify direct element styles
    const cardElement = document.querySelector('.welcome-header-card');
    if (cardElement) {
      console.log("WelcomeHeader card computed styles:", {
        borderColor: getComputedStyle(cardElement).borderColor,
        backgroundColor: getComputedStyle(cardElement).backgroundColor
      });
    }
  }, []);

  return (
    <Card className="welcome-header-card border-2 border-primary">
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
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-sm font-medium">Tema actual:</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary border border-gray-300"></div>
              <span className="text-xs">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary border border-gray-300"></div>
              <span className="text-xs">Secondary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent border border-gray-300"></div>
              <span className="text-xs">Accent</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
