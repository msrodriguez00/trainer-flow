
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingExercise } from "@/hooks/client/session/types";
import { Dumbbell } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

interface ExerciseDetailsProps {
  exercise: TrainingExercise;
}

const ExerciseDetails: React.FC<ExerciseDetailsProps> = ({ exercise }) => {
  // Extract video URL from the exercise level data
  const getVideoUrl = (): string | undefined => {
    try {
      if (!exercise) return undefined;
      if (exercise.videoUrl) return exercise.videoUrl;
      return undefined;
    } catch (error) {
      console.error("Error getting video URL:", error);
      return undefined;
    }
  };

  // Render level indicator dots
  const renderLevelIndicator = () => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      dots.push(
        <div 
          key={i}
          className={`h-2 w-2 rounded-full ${i < exercise.level ? "bg-primary" : "bg-muted"}`}
        ></div>
      );
    }
    return dots;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{exercise.exerciseName}</span>
          <div className="flex gap-1 items-center text-sm font-normal">
            <Dumbbell className="h-4 w-4 mr-1" />
            <span>Nivel {exercise.level}</span>
            <div className="ml-2 flex gap-1">
              {renderLevelIndicator()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VideoPlayer 
          videoUrl={getVideoUrl()}
          title={exercise.exerciseName || "Ejercicio"}
        />
      </CardContent>
    </Card>
  );
};

export default ExerciseDetails;
