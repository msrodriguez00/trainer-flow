
import { useState } from "react";
import { Exercise, Category, Level } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CategorySelection } from "./exercises/CategorySelection";
import { ExerciseLevelsList } from "./exercises/ExerciseLevelsList";
import { EXERCISE_CATEGORIES } from "./exercises/constants";

interface NewExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  initialExercise?: Exercise;
}

const NewExerciseForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialExercise,
}: NewExerciseFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialExercise?.name || "");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    initialExercise?.categories || []
  );
  const [levels, setLevels] = useState<Omit<Level, "level">[]>(
    initialExercise?.levels.map((l) => ({
      video: l.video,
      repetitions: l.repetitions,
      weight: l.weight,
    })) || [{ video: "", repetitions: 0, weight: 0 }]
  );
  const [videoErrors, setVideoErrors] = useState<boolean[]>(
    initialExercise?.levels.map(() => false) || [false]
  );

  const handleCategoryChange = (category: Category, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    }
  };

  const updateLevel = (index: number, field: keyof Omit<Level, "level">, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: typeof value === "string" && field !== "video" ? parseInt(value) || 0 : value,
    };
    setLevels(newLevels);
  };

  const addLevel = () => {
    setLevels([...levels, { video: "", repetitions: 0, weight: 0 }]);
    setVideoErrors([...videoErrors, false]);
  };

  const removeLevel = (index: number) => {
    if (levels.length > 1) {
      setLevels(levels.filter((_, i) => i !== index));
      setVideoErrors(videoErrors.filter((_, i) => i !== index));
    }
  };

  const handleVideoValidationChange = (index: number, isValid: boolean) => {
    const newErrors = [...videoErrors];
    newErrors[index] = !isValid;
    setVideoErrors(newErrors);
  };

  const handleSubmit = () => {
    if (!name || selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Completa el nombre y selecciona al menos una categoría",
        variant: "destructive",
      });
      return;
    }

    // Verificar si hay errores en las URLs de YouTube
    const hasVideoErrors = videoErrors.some(error => error);
    if (hasVideoErrors) {
      toast({
        title: "Error",
        description: "Hay URLs de video inválidas. Solo se permiten enlaces de YouTube.",
        variant: "destructive",
      });
      return;
    }

    const formattedLevels: Level[] = levels.map((level, idx) => ({
      level: idx + 1,
      ...level,
    }));

    onSubmit({
      name,
      categories: selectedCategories,
      levels: formattedLevels,
    });

    resetForm();
  };

  const resetForm = () => {
    if (!initialExercise) {
      setName("");
      setSelectedCategories([]);
      setLevels([{ video: "", repetitions: 0, weight: 0 }]);
      setVideoErrors([false]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Ejercicio</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sentadillas"
            />
          </div>

          <CategorySelection
            categories={EXERCISE_CATEGORIES}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
          />

          <ExerciseLevelsList
            levels={levels}
            videoErrors={videoErrors}
            onUpdateLevel={updateLevel}
            onAddLevel={addLevel}
            onRemoveLevel={removeLevel}
            onVideoValidationChange={handleVideoValidationChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewExerciseForm;
