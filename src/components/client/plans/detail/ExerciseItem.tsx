
import React from "react";
import { Dumbbell } from "lucide-react";

interface ExerciseItemProps {
  name: string;
  level: number;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({ name, level }) => {
  // Función para renderizar los indicadores de nivel
  const renderLevelIndicator = () => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      dots.push(
        <div 
          key={i}
          className={`h-2 w-2 rounded-full ${i < level ? "bg-primary" : "bg-muted"}`}
        ></div>
      );
    }
    return dots;
  };

  return (
    <div className="p-3 bg-muted/20 rounded-md hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            Nivel {level}
          </p>
        </div>
        <div className="flex gap-1">
          {renderLevelIndicator()}
        </div>
      </div>
    </div>
  );
};

export default ExerciseItem;
