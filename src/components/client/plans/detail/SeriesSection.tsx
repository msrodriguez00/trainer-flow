
import React from "react";
import SessionExerciseItem from "./SessionExerciseItem";

interface Exercise {
  exerciseName: string;
  level: number;
  exerciseId: string;
  evaluations: any[];
}

interface SeriesProps {
  id: string;
  name: string;
  orderIndex: number;
  exercises: Exercise[];
}

const SeriesSection: React.FC<SeriesProps> = ({ name, exercises }) => {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="font-medium text-primary mb-2">{name}</h4>
      
      {exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((exercise, idx) => (
            <SessionExerciseItem 
              key={idx} 
              exerciseName={exercise.exerciseName} 
              level={exercise.level}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay ejercicios en esta serie
        </p>
      )}
    </div>
  );
};

export default SeriesSection;
