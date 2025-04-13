
import { Exercise } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useExerciseForm } from "./hooks/useExerciseForm";
import { CategorySelection } from "./CategorySelection";
import { ExerciseLevelsList } from "./ExerciseLevelsList";
import { ExerciseNameInput } from "./ExerciseNameInput";
import { EXERCISE_CATEGORIES } from "./constants";

interface ExerciseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  initialExercise?: Exercise;
}

export const ExerciseFormDialog = ({
  isOpen,
  onClose,
  onSubmit,
  initialExercise,
}: ExerciseFormDialogProps) => {
  const {
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
  } = useExerciseForm({ initialExercise, onSubmit, onClose });

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
