
import { useState, useEffect } from "react";
import { Exercise } from "@/types";
import { Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExerciseSelectionProps {
  exerciseIndex: number;
  seriesIndex: number;
  sessionIndex: number;
  exercise: {
    exerciseId: string;
    level: number;
    sessionId: string;
    seriesId: string;
  };
  exercises: Exercise[];
  onExerciseChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => void;
  onLevelChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => void;
  onRemove: (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => void;
}

export const ExerciseSelection = ({
  exerciseIndex,
  seriesIndex,
  sessionIndex,
  exercise,
  exercises,
  onExerciseChange,
  onLevelChange,
  onRemove
}: ExerciseSelectionProps) => {
  const getAvailableLevels = (exerciseId: string): number[] => {
    if (!exerciseId) return [1];
    
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    
    if (!selectedExercise || !selectedExercise.levels || selectedExercise.levels.length === 0) {
      return [1];
    }
    
    return selectedExercise.levels.map((l) => l.level);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4">
      <div className="flex-grow space-y-2">
        <Label htmlFor={`exercise-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>Ejercicio</Label>
        <Select
          value={exercise.exerciseId}
          onValueChange={(value) => onExerciseChange(sessionIndex, seriesIndex, exerciseIndex, value)}
          required
        >
          <SelectTrigger id={`exercise-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
            <SelectValue placeholder="Seleccionar ejercicio" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((ex) => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {exercise.exerciseId && (
        <div className="w-24 space-y-2">
          <Label htmlFor={`level-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>Nivel</Label>
          <Select
            value={exercise.level.toString()}
            onValueChange={(value) => onLevelChange(sessionIndex, seriesIndex, exerciseIndex, parseInt(value))}
            required
          >
            <SelectTrigger id={`level-${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableLevels(exercise.exerciseId).map(
                (level) => (
                  <SelectItem key={level} value={level.toString()}>
                    {level}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={() => onRemove(sessionIndex, seriesIndex, exerciseIndex)}
      >
        <Trash className="h-5 w-5 text-red-500" />
      </Button>
    </div>
  );
};
