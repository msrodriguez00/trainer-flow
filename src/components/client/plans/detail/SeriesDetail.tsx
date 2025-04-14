
import React from "react";
import { PlanExercise } from "@/types";
import ExerciseItem from "./ExerciseItem";

interface SeriesDetailProps {
  name: string;
  exercises: PlanExercise[];
}

const SeriesDetail: React.FC<SeriesDetailProps> = ({ name, exercises }) => {
  return (
    <div className="mt-4 first:mt-0">
      <h4 className="font-medium text-primary mb-2">{name}</h4>
      
      {exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((exercise, idx) => (
            <ExerciseItem 
              key={idx} 
              name={exercise.exerciseName} 
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

export default SeriesDetail;
