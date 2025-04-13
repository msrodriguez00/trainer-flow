
import { Exercise } from "@/types";
import { ExerciseFormDialog } from "./ExerciseFormDialog";

interface NewExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  initialExercise?: Exercise;
}

const NewExerciseForm = (props: NewExerciseFormProps) => {
  return <ExerciseFormDialog {...props} />;
};

export default NewExerciseForm;
