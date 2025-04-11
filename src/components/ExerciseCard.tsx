
import { useState } from "react";
import { Exercise } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Video, Activity, Sigma, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryIcons: Record<string, JSX.Element> = {
  strength: <Dumbbell className="h-3 w-3" />,
  cardio: <Activity className="h-3 w-3" />,
  flexibility: <Activity className="h-3 w-3" />,
  balance: <Activity className="h-3 w-3" />,
  core: <Sigma className="h-3 w-3" />,
};

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exerciseId: string) => void;
}

const ExerciseCard = ({
  exercise,
  onEdit,
  onDelete,
}: ExerciseCardProps) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const toggleLevel = (level: number) => {
    if (expandedLevel === level) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(level);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{exercise.name}</CardTitle>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(exercise)}>
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onDelete(exercise.id)}
                  >
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {exercise.categories.map((category) => (
            <Badge key={category} variant="outline" className="flex gap-1 items-center">
              {categoryIcons[category]}
              <span className="capitalize">{category}</span>
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {exercise.levels.map((level) => (
            <div
              key={level.level}
              className="border rounded-md overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center p-2 bg-secondary/40 hover:bg-secondary/60 text-left"
                onClick={() => toggleLevel(level.level)}
              >
                <span className="font-medium">Nivel {level.level}</span>
                <span>
                  {expandedLevel === level.level ? "▼" : "►"}
                </span>
              </button>
              {expandedLevel === level.level && (
                <div className="p-3 bg-white space-y-2">
                  <div className="flex items-center text-sm">
                    <Video className="h-4 w-4 mr-2 text-gray-500" />
                    <a
                      href={level.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Ver video
                    </a>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Repeticiones:</span>{" "}
                      {level.repetitions}
                    </div>
                    <div>
                      <span className="text-gray-500">Carga (kg):</span>{" "}
                      {level.weight}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseCard;
