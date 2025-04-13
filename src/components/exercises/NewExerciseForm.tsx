
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
    console.log("NewExerciseForm useEffect - isOpen:", props.isOpen);
    
    return () => {
      if (props.isOpen) {
        console.log("NewExerciseForm - Cleanup on unmount while open");
        props.onClose();
      }
    };
  }, [props.isOpen, props.onClose]);
  
  // Only render dialog when it's actually open
  if (!props.isOpen) {
    console.log("NewExerciseForm - Not rendering dialog because isOpen is false");
    return null;
  }

  console.log("NewExerciseForm - Rendering dialog with initialExercise:", props.initialExercise?.id);
  return <ExerciseFormDialog {...props} />;
};

export default NewExerciseForm;
