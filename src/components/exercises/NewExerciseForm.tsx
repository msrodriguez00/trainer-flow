
import { useState, useEffect } from "react";
import { Exercise, Category, Level } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CategorySelection } from "./CategorySelection";
import { ExerciseLevelsList } from "./ExerciseLevelsList";
import { ExerciseNameInput } from "./ExerciseNameInput";
import { EXERCISE_CATEGORIES } from "./constants";

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
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Omit<Level, "level">[]>([
    { video: "", repetitions: 0, weight: 0 }
  ]);
  const [videoErrors, setVideoErrors] = useState<boolean[]>([false]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to initialize form when initialExercise changes or dialog opens
  useEffect(() => {
    if (initialExercise && isOpen) {
      setName(initialExercise.name);
      setSelectedCategories(initialExercise.categories);
      
      // Map the levels from the initialExercise, omitting the "level" property
      const formattedLevels = initialExercise.levels.map(level => ({
        video: level.video,
        repetitions: level.repetitions,
        weight: level.weight
      }));
      
      setLevels(formattedLevels);
      setVideoErrors(new Array(formattedLevels.length).fill(false));
    } else if (!initialExercise && isOpen) {
      // Reset form when opening for a new exercise
      resetForm();
    }
  }, [initialExercise, isOpen]);

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

    setIsSubmitting(true);

    const formattedLevels: Level[] = levels.map((level, idx) => ({
      level: idx + 1,
      ...level,
    }));

    try {
      onSubmit({
        name,
        categories: selectedCategories,
        levels: formattedLevels,
      });
      
      if (!initialExercise) {
        resetForm();
      }
    } finally {
      // Ensure we always clean up even if onSubmit fails
      setIsSubmitting(false);
      // Don't close here - let the parent component handle closing on successful submission
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedCategories([]);
    setLevels([{ video: "", repetitions: 0, weight: 0 }]);
    setVideoErrors([false]);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
          </DialogTitle>
          <DialogDescription>
            {initialExercise 
              ? "Modifica los detalles del ejercicio seleccionado." 
              : "Añade un nuevo ejercicio a tu colección."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ExerciseNameInput 
            name={name} 
            onChange={setName} 
          />

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
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewExerciseForm;
