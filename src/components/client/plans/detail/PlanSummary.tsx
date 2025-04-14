
import React from "react";
import { Activity } from "lucide-react";
import { Plan } from "@/types";

interface PlanSummaryProps {
  plan: Plan;
}

export const PlanSummary: React.FC<PlanSummaryProps> = ({ plan }) => {
  // Calcular el número total de ejercicios en todo el plan
  const totalExercises = plan?.sessions.reduce((total, session) => {
    return total + session.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.exercises.length;
    }, 0);
  }, 0) || 0;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Activity className="h-5 w-5 mr-2 text-primary" />
        Resumen del plan
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Sesiones</p>
          <p className="text-2xl font-semibold">{plan.sessions.length}</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Series</p>
          <p className="text-2xl font-semibold">
            {plan.sessions.reduce((acc, session) => acc + session.series.length, 0)}
          </p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">Ejercicios</p>
          <p className="text-2xl font-semibold">{totalExercises}</p>
        </div>
      </div>
    </div>
  );
};

export default PlanSummary;
