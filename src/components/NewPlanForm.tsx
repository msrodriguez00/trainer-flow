
import PlanForm from "./plan/PlanForm";
import { PlanFormProps } from "@/hooks/plan/types/planFormTypes";

const NewPlanForm = ({ initialClientId, onSubmit }: PlanFormProps) => {
  return (
    <PlanForm
      initialClientId={initialClientId}
      onSubmit={onSubmit}
    />
  );
};

export default NewPlanForm;
