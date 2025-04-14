
import React from "react";

interface ExerciseProps {
  exerciseName: string;
  level: number;
}

const SessionExerciseItem: React.FC<ExerciseProps> = ({ exerciseName, level }) => {
  return (
    <div className="p-3 bg-muted/20 rounded-md">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">{exerciseName}</p>
          <p className="text-sm text-muted-foreground">Nivel {level}</p>
        </div>
      </div>
    </div>
  );
};

export default SessionExerciseItem;
