
import { PlanExercise, Client } from "@/types";
import PlanForm from "./plan/PlanForm";

interface NewPlanFormProps {
  initialClientId?: string;
  onSubmit: (plan: {
    name: string;
    clientId: string;
    month?: string;
    exercises: PlanExercise[];
    sessions?: any[];
  }) => void;
}

const NewPlanForm = ({ initialClientId, onSubmit }: NewPlanFormProps) => {
  return (
    <PlanForm
      initialClientId={initialClientId}
      onSubmit={onSubmit}
    />
  );
};

export default NewPlanForm;
