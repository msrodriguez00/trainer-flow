
import { Exercise } from "@/types";
import { ExerciseFormDialog } from "./ExerciseFormDialog";
import { useEffect } from "react";

interface NewExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  initialExercise?: Exercise;
}

const NewExerciseForm = (props: NewExerciseFormProps) => {
  // Ensure cleanup happens if component unmounts while open
  useEffect(() => {
    return () => {
      if (props.isOpen) {
        // Force cleanup on unmount if still open
        setTimeout(() => {
          props.onClose();
        }, 0);
      }
    };
  }, [props.isOpen, props.onClose]);
  
  // Only render dialog when it's actually open
  if (!props.isOpen) {
    return null;
  }

  return <ExerciseFormDialog {...props} />;
};

export default NewExerciseForm;
