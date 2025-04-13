
import { useState, useEffect } from "react";
import { Exercise, Category, Level } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface UseExerciseFormProps {
  initialExercise?: Exercise;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  onClose: () => void;
}

export const useExerciseForm = ({ initialExercise, onSubmit, onClose }: UseExerciseFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<Omit<Level, "level">[]>([
    { video: "", repetitions: 0, weight: 0 }
  ]);
  const [videoErrors, setVideoErrors] = useState<boolean[]>([false]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to initialize form when initialExercise changes
  useEffect(() => {
    if (initialExercise) {
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
    } else {
      resetForm();
    }
  }, [initialExercise]);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedCategories([]);
    setLevels([{ video: "", repetitions: 0, weight: 0 }]);
    setVideoErrors([false]);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Small delay to prevent React state update conflicts
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  return {
    name,
    setName,
    selectedCategories,
    levels,
    videoErrors,
    isSubmitting,
    handleCategoryChange,
    updateLevel,
    addLevel,
    removeLevel,
    handleVideoValidationChange,
    handleSubmit,
    handleDialogChange
  };
};
