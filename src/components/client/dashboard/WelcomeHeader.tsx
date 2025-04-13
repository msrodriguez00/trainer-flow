
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerSelector from "./TrainerSelector";
import { useTrainerSelection } from "@/hooks/client/useTrainerSelection";
import { useAuth } from "@/hooks/useAuth";

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

  console.log("WelcomeHeader rendered with trainers:", trainers);

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

          {/* Debug info - only visible during development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-4 border-t pt-2">
              <p>Debug: User ID: {user?.id || 'No user'}</p>
              <p>Debug: Email: {userEmail}</p>
              <p>Debug: Trainers loaded: {trainers.length}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
