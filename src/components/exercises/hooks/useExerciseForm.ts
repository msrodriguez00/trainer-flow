
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
    console.log("useExerciseForm - initialExercise changed:", initialExercise?.id);
    
    if (initialExercise) {
      console.log("useExerciseForm - Setting form data from initialExercise");
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
      console.log("useExerciseForm - No initialExercise, resetting form");
      resetForm();
    }
    
    // Cleanup function
    return () => {
      console.log("useExerciseForm - Cleanup on unmount or initialExercise change");
    };
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

  const handleSubmit = async () => {
    console.log("useExerciseForm - handleSubmit called");
    
    if (!name || selectedCategories.length === 0) {
      console.log("useExerciseForm - Validation failed: missing name or categories");
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
      console.log("useExerciseForm - Validation failed: invalid YouTube URLs");
      toast({
        title: "Error",
        description: "Hay URLs de video inválidas. Solo se permiten enlaces de YouTube.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("useExerciseForm - Setting isSubmitting to true");

    const formattedLevels: Level[] = levels.map((level, idx) => ({
      level: idx + 1,
      ...level,
    }));

    try {
      console.log("useExerciseForm - Calling onSubmit");
      await onSubmit({
        name,
        categories: selectedCategories,
        levels: formattedLevels,
      });
      
      console.log("useExerciseForm - onSubmit completed successfully");
      // Clean up state after successful submission
      resetForm();
    } catch (error) {
      console.error("useExerciseForm - Error submitting exercise:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el ejercicio.",
        variant: "destructive",
      });
    } finally {
      console.log("useExerciseForm - Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    console.log("useExerciseForm - Resetting form state");
    setName("");
    setSelectedCategories([]);
    setLevels([{ video: "", repetitions: 0, weight: 0 }]);
    setVideoErrors([false]);
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
  };
};
