
import { Plus, Trash, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExerciseSelection } from "./ExerciseSelection";
import { Exercise } from "@/types";

interface SeriesCardProps {
  sessionIndex: number;
  seriesIndex: number;
  series: {
    id: string;
    name: string;
    exercises: {
      exerciseId: string;
      level: number;
      sessionId: string;
      seriesId: string;
    }[];
  };
  exercises: Exercise[];
  onSeriesNameChange: (sessionIndex: number, seriesIndex: number, name: string) => void;
  onRemoveSeries: (sessionIndex: number, seriesIndex: number) => void;
  onAddExercise: (sessionIndex: number, seriesIndex: number) => void;
  onExerciseChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => void;
  onLevelChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => void;
  onRemoveExercise: (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => void;
}

export const SeriesCard = ({
  sessionIndex,
  seriesIndex,
  series,
  exercises,
  onSeriesNameChange,
  onRemoveSeries,
  onAddExercise,
  onExerciseChange,
  onLevelChange,
  onRemoveExercise
}: SeriesCardProps) => {
  return (
    <Card key={series.id} className="overflow-hidden">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-gray-50">
        <div className="flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          <Input
            value={series.name}
            onChange={(e) => onSeriesNameChange(sessionIndex, seriesIndex, e.target.value)}
            className="h-8 w-52"
            placeholder="Nombre de la serie"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSeries(sessionIndex, seriesIndex)}
            className="h-8 w-8 p-0"
            disabled={false}
          >
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {series.exercises.map((exercise, exerciseIndex) => (
            <Card key={`${sessionIndex}-${seriesIndex}-${exerciseIndex}`}>
              <CardContent className="p-4">
                <ExerciseSelection
                  exerciseIndex={exerciseIndex}
                  seriesIndex={seriesIndex}
                  sessionIndex={sessionIndex}
                  exercise={exercise}
                  exercises={exercises}
                  onExerciseChange={onExerciseChange}
                  onLevelChange={onLevelChange}
                  onRemove={onRemoveExercise}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddExercise(sessionIndex, seriesIndex)}
            className="w-full mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir ejercicio a esta serie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
