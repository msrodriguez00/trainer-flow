
import React from "react";

interface ExerciseItemProps {
  name: string;
  level: number;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({ name, level }) => {
  return (
    <div className="p-3 bg-muted/20 rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">Nivel {level}</p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseItem;
