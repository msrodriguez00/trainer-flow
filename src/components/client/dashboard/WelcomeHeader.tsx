
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrainerSelector from "./TrainerSelector";
import { useTrainerSelection } from "@/hooks/client/useTrainerSelection";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useTrainerTheme } from "@/hooks/client/useTrainerTheme";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

const WelcomeHeader = ({ userName, userEmail, onTrainerChange }: WelcomeHeaderProps) => {
  const { user } = useAuth();
  const { currentTheme } = useTrainerTheme();
  const [themeColors, setThemeColors] = useState({
    primary: '',
    secondary: '',
    accent: ''
  });
  
  const themeCheckRef = useRef(false);
  
  const {
    trainers,
    loading,
    selectedTrainerId,
    handleTrainerSelect
  } = useTrainerSelection(onTrainerChange);

  // Update theme colors for display only once on mount and when theme actually changes
  useEffect(() => {
    // Skip if we've already run this effect and currentTheme hasn't actually changed
    if (themeCheckRef.current && !currentTheme) return;
    
    const root = document.documentElement;
    const colors = {
      primary: getComputedStyle(root).getPropertyValue('--client-primary').trim(),
      secondary: getComputedStyle(root).getPropertyValue('--client-secondary').trim(),
      accent: getComputedStyle(root).getPropertyValue('--client-accent').trim()
    };
    
    if (colors.primary) {
      console.log("WelcomeHeader - Current CSS variables:", colors);
      setThemeColors(colors);
      themeCheckRef.current = true;
    }
    
    // Only log these if they exist (prevents unnecessary re-renders)
    const storedBranding = sessionStorage.getItem('selected_trainer_branding');
    if (storedBranding && !themeCheckRef.current) {
      console.log("WelcomeHeader - stored branding:", JSON.parse(storedBranding));
    }
  }, [currentTheme]);

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
