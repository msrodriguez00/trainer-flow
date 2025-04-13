
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExerciseNameInputProps {
  name: string;
  onChange: (value: string) => void;
}

export const ExerciseNameInput = ({ name, onChange }: ExerciseNameInputProps) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="name">Nombre del Ejercicio</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Sentadillas"
      />
    </div>
  );
};
