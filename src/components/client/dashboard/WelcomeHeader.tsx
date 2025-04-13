
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
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/30 border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">¡Bienvenido, {userName}!</CardTitle>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
