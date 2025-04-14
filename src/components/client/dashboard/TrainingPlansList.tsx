
import React from "react";
import { ClipboardList, Shield } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { usePlans } from "@/components/client/plans/usePlans";
import PlansList from "@/components/client/plans/PlansList";
import EmptyPlansList from "@/components/client/plans/EmptyPlansList";
import { useAuth } from "@/hooks/useAuth";
import ClientAuthError from "@/components/client/common/ClientAuthError";

export const TrainingPlansList = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { plans, loading } = usePlans();

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Mis Planes de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-6">Cargando información...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return <ClientAuthError message="Necesitas iniciar sesión para ver tus planes de entrenamiento" />;
  }

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
