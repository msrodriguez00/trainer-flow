
import { Level } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ExerciseLevelItem } from "./ExerciseLevelItem";

// Definir el tipo LevelFormData para uso interno
interface LevelFormData {
  video: string;
  repetitions: number;
  weight: number;
}

interface ExerciseLevelsListProps {
  levels: LevelFormData[];
  videoErrors: boolean[];
  onUpdateLevel: (index: number, field: keyof LevelFormData, value: string | number) => void;
  onAddLevel: () => void;
  onRemoveLevel: (index: number) => void;
  onVideoValidationChange: (index: number, isValid: boolean) => void;
}

export const ExerciseLevelsList = ({
  levels,
  videoErrors,
  onUpdateLevel,
  onAddLevel,
  onRemoveLevel,
  onVideoValidationChange,
}: ExerciseLevelsListProps) => {
  return (
    <div className="grid gap-2">
      <Label>Niveles</Label>
      {levels.map((level, idx) => (
        <ExerciseLevelItem
          key={idx}
          index={idx}
          level={level}
          videoError={videoErrors[idx]}
          onUpdate={onUpdateLevel}
          onRemove={onRemoveLevel}
          onVideoValidationChange={onVideoValidationChange}
          canRemove={levels.length > 1}
        />
      ))}

      <Button
        variant="outline"
        type="button"
        onClick={onAddLevel}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Añadir nivel
      </Button>
    </div>
  );
};
