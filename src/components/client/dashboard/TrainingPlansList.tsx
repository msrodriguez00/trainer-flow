
import React from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { usePlans } from "@/components/client/plans/usePlans";
import PlansList from "@/components/client/plans/PlansList";
import EmptyPlansList from "@/components/client/plans/EmptyPlansList";

export const TrainingPlansList = () => {
  const { plans, loading } = usePlans();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardList className="mr-2 h-5 w-5" />
          Mis Planes de Entrenamiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-gray-500">Cargando planes...</p>
        ) : plans.length > 0 ? (
          <PlansList plans={plans} />
        ) : (
          <EmptyPlansList />
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingPlansList;
