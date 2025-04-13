
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
  // Add detailed logging
  useEffect(() => {
    console.log("NewExerciseForm mounted - props:", {
      isOpen: props.isOpen,
      initialExerciseId: props.initialExercise?.id,
    });
    
    // Cleanup function 
    return () => {
      console.log("NewExerciseForm unmounting - props:", {
        isOpen: props.isOpen,
        initialExerciseId: props.initialExercise?.id,
      });
      
      // Only call onClose if dialog was open when component unmounts
      if (props.isOpen) {
        console.log("NewExerciseForm - Calling onClose during unmount while dialog was open");
        props.onClose();
      }
    };
  }, [props.isOpen, props.onClose, props.initialExercise]);
  
  // Separate logging for render phase
  console.log("NewExerciseForm rendering - isOpen:", props.isOpen, "initialExercise:", props.initialExercise?.id);
  
  // Only render dialog when it's actually open
  if (!props.isOpen) {
    console.log("NewExerciseForm - Not rendering dialog because isOpen is false");
    return null;
  }

  return <ExerciseFormDialog {...props} />;
};

export default NewExerciseForm;
