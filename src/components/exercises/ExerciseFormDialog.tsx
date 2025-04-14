
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
import { useEffect, useCallback } from "react";

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
    resetForm,
  } = useExerciseForm({ initialExercise, onSubmit, onClose });

  // Safe close handler that ensures form state is properly reset
  const safeClose = useCallback(() => {
    console.log("ExerciseFormDialog - safeClose called");
    resetForm(); // Make sure form is reset
    onClose(); // Then close the dialog
  }, [onClose, resetForm]);

  useEffect(() => {
    console.log("ExerciseFormDialog useEffect - isOpen:", isOpen, "initialExercise:", initialExercise?.id);
    
    // If dialog is closed, ensure form is reset
    if (!isOpen) {
      console.log("ExerciseFormDialog - Dialog closed, resetting form");
      resetForm();
    }
    
    return () => {
      console.log("ExerciseFormDialog - Cleanup on unmount, isOpen:", isOpen);
    };
  }, [isOpen, initialExercise, resetForm]);

  const handleDialogChange = useCallback((open: boolean) => {
    console.log("ExerciseFormDialog - Dialog state changed to:", open);
    
    if (!open) {
      safeClose();
    }
  }, [safeClose]);

  // Add debug info for rendering decision
  console.log("ExerciseFormDialog render check - isOpen:", isOpen);
  
  // If dialog is not open, don't render anything
  if (!isOpen) {
    console.log("ExerciseFormDialog - Not rendering content because isOpen is false");
    return null;
  }

  console.log("ExerciseFormDialog - Rendering dialog content with initialExercise:", initialExercise?.id);
  
  return (
    <Dialog 
      open={isOpen} // Use isOpen instead of hardcoded true
      onOpenChange={handleDialogChange} 
      modal={true}
    >
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
            onClick={() => {
              console.log("ExerciseFormDialog - Cancel button clicked");
              safeClose();
            }} 
            disabled={isSubmitting}
            type="button"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              console.log("ExerciseFormDialog - Save button clicked");
              handleSubmit();
            }}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
