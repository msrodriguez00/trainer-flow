import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import MainLayout from "@/components/client/layout/MainLayout";
import ClientAuthError from "@/components/client/common/ClientAuthError";
import LoadingScreen from "@/components/client/common/LoadingScreen";
import PlanSummary from "@/components/client/plans/detail/PlanSummary";
import SessionsList from "@/components/client/plans/detail/SessionsList";
import PlanNotFound from "@/components/client/plans/detail/PlanNotFound";
import { usePlanDetail } from "@/hooks/client/plans/usePlanDetail";
import { checkSessionRLSPolicies, ensureSessionRLSPolicies } from "@/utils/debugUtils";

const ClientPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plan, loading, handleScheduleSession } = usePlanDetail(id);

  useEffect(() => {
    // Verificamos las políticas RLS al cargar la página
    const checkRLS = async () => {
      try {
        console.log("ClientPlanDetail - Verificando políticas RLS para sesiones");
        await checkSessionRLSPolicies();
        console.log("ClientPlanDetail - Asegurando que las políticas RLS estén aplicadas");
        const result = await ensureSessionRLSPolicies();
        console.log("ClientPlanDetail - Resultado de asegurar políticas:", result);
      } catch (error) {
        console.error("Error verificando políticas RLS:", error);
      }
    };
    
    checkRLS();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!plan?.clientId) {
    return <ClientAuthError message="Necesitas iniciar sesión para ver los detalles del plan" />;
  }

  const totalSeriesCount = plan?.sessions.reduce((total, session) => {
    return total + session.series.length;
  }, 0) || 0;

  const totalExercisesCount = plan?.sessions.reduce((total, session) => {
    return total + session.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.exercises.length;
    }, 0);
  }, 0) || 0;

  const handleScheduleSessionWithLogs = async (sessionId: string, date: Date) => {
    console.log("ClientPlanDetail - Programando sesión:", sessionId, "para la fecha:", date);
    try {
      await handleScheduleSession(sessionId, date);
      console.log("ClientPlanDetail - Sesión programada exitosamente");
    } catch (error) {
      console.error("ClientPlanDetail - Error programando sesión:", error);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/client-plans")} 
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a mis planes
        </Button>
        
        {!loading && !plan && <PlanNotFound />}
        
        {plan && (
          <Card className="shadow-md">
            <PlanSummary
              name={plan.name}
              createdAt={plan.createdAt}
              month={plan.month}
              sessionCount={plan.sessions.length}
              seriesCount={totalSeriesCount}
              exercisesCount={totalExercisesCount}
            />
            
            <SessionsList 
              sessions={plan.sessions} 
              onScheduleSession={handleScheduleSessionWithLogs}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientPlanDetail;
