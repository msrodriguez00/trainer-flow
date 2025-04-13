
import React from "react";
import { Plan } from "@/types";
import PlanItem from "./PlanItem";

interface PlansListProps {
  plans: Plan[];
}

const PlansList: React.FC<PlansListProps> = ({ plans }) => {
  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <PlanItem key={plan.id} plan={plan} />
      ))}
    </div>
  );
};

export default PlansList;
