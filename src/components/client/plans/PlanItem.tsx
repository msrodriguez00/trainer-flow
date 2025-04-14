
import React from "react";
import { ClipboardList, Calendar } from "lucide-react";
import { Plan } from "@/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlanItemProps {
  plan: Plan;
}

export const PlanItem: React.FC<PlanItemProps> = ({ plan }) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calcular el número total de ejercicios en todo el plan
  const totalExercises = plan.sessions.reduce((total, session) => {
    return total + session.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.exercises.length;
    }, 0);
  }, 0);
  
  const handlePlanClick = () => {
    navigate(`/client-plan/${plan.id}`);
  };
  
  return (
    <div key={plan.id}>
      <Button 
        variant="outline" 
        className="w-full justify-start"
        onClick={handlePlanClick}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>{plan.name}</span>
          </div>
          {plan.month && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{plan.month}</span>
            </div>
          )}
        </div>
      </Button>
    </div>
  );
};

export default PlanItem;
