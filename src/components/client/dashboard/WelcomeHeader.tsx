
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
}

const WelcomeHeader = ({ userName, userEmail }: WelcomeHeaderProps) => {
  const trainerId = sessionStorage.getItem('selected_trainer_id');
  const trainerName = sessionStorage.getItem('selected_trainer_name') || "Tu Entrenador";
  
  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/30 border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">¡Bienvenido, {userName}!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-gray-600">{userEmail}</p>
          {trainerId && (
            <p className="text-gray-600">
              Entrenador: <span className="font-medium">{trainerName}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
