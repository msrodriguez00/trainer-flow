
import { Level } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus } from "lucide-react";
import { VideoUrlInput } from "./VideoUrlInput";

interface ExerciseLevelItemProps {
  index: number;
  level: Omit<Level, "level">;
  videoError: boolean;
  onUpdate: (index: number, field: keyof Omit<Level, "level">, value: string | number) => void;
  onRemove: (index: number) => void;
  onVideoValidationChange: (index: number, isValid: boolean) => void;
  canRemove: boolean;
}

export const ExerciseLevelItem = ({
  index,
  level,
  videoError,
  onUpdate,
  onRemove,
  onVideoValidationChange,
  canRemove,
}: ExerciseLevelItemProps) => {
  return (
    <div className="border p-3 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Nivel {index + 1}</h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <VideoUrlInput
        id={`video-${index}`}
        value={level.video}
        onChange={(value) => onUpdate(index, "video", value)}
        hasError={videoError}
        onValidationChange={(isValid) => onVideoValidationChange(index, isValid)}
      />

      <LevelMetricsInputs 
        index={index}
        level={level}
        onUpdate={onUpdate}
      />
    </div>
  );
};

interface LevelMetricsInputsProps {
  index: number;
  level: Omit<Level, "level">;
  onUpdate: (index: number, field: keyof Omit<Level, "level">, value: string | number) => void;
}

export const LevelMetricsInputs = ({ index, level, onUpdate }: LevelMetricsInputsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor={`rep-${index}`}>Repeticiones</Label>
        <Input
          id={`rep-${index}`}
          type="number"
          value={level.repetitions}
          onChange={(e) => onUpdate(index, "repetitions", e.target.value)}
          min="0"
        />
      </div>
      <div>
        <Label htmlFor={`weight-${index}`}>Carga (kg)</Label>
        <Input
          id={`weight-${index}`}
          type="number"
          value={level.weight}
          onChange={(e) => onUpdate(index, "weight", e.target.value)}
          min="0"
        />
      </div>
    </div>
  );
};
