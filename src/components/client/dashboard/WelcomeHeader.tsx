
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerSelector from "./TrainerSelector";
import { useTrainerSelection } from "@/hooks/client/useTrainerSelection";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useClientTheme } from "@/hooks/client/useClientTheme";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

const WelcomeHeader = ({ userName, userEmail, onTrainerChange }: WelcomeHeaderProps) => {
  const { user } = useAuth();
  const { clientTheme } = useClientTheme();
  const [themeColors, setThemeColors] = useState({
    primary: '',
    secondary: '',
    accent: ''
  });
  
  const {
    trainers,
    loading,
    selectedTrainerId,
    handleTrainerSelect
  } = useTrainerSelection(onTrainerChange);

  // Update theme colors for display whenever clientTheme changes
  useEffect(() => {
    if (clientTheme) {
      setThemeColors({
        primary: clientTheme.primaryColor,
        secondary: clientTheme.secondaryColor,
        accent: clientTheme.accentColor
      });
      
      console.log("WelcomeHeader - Theme colors updated:", {
        primary: clientTheme.primaryColor,
        secondary: clientTheme.secondaryColor,
        accent: clientTheme.accentColor
      });
    } else {
      // Fallback to CSS variables if clientTheme is not available
      const root = document.documentElement;
      const colors = {
        primary: getComputedStyle(root).getPropertyValue('--client-primary').trim(),
        secondary: getComputedStyle(root).getPropertyValue('--client-secondary').trim(),
        accent: getComputedStyle(root).getPropertyValue('--client-accent').trim()
      };
      
      if (colors.primary) {
        setThemeColors(colors);
        console.log("WelcomeHeader - Fallback to CSS variables:", colors);
      }
    }
  }, [clientTheme]);

  return (
    <Card className="welcome-header-card border-2" style={{ borderColor: themeColors.primary }}>
      <CardHeader className="pb-2" style={{ backgroundColor: `${themeColors.secondary}80` }}>
        <CardTitle className="text-2xl" style={{ color: themeColors.primary }}>¡Bienvenido, {userName}!</CardTitle>
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
              <div className="w-6 h-6 rounded-full border border-gray-300" 
                style={{ backgroundColor: themeColors.primary }}></div>
              <span className="text-xs">Primary: {themeColors.primary}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-300" 
                style={{ backgroundColor: themeColors.secondary }}></div>
              <span className="text-xs">Secondary: {themeColors.secondary}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-300" 
                style={{ backgroundColor: themeColors.accent }}></div>
              <span className="text-xs">Accent: {themeColors.accent}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeHeader;
