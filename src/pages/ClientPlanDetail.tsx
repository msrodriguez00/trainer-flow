
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/client/layout/MainLayout";
import ClientAuthError from "@/components/client/common/ClientAuthError";
import LoadingScreen from "@/components/client/common/LoadingScreen";
import { useClientPlanDetail } from "@/hooks/client/useClientPlanDetail";
import PlanHeader from "@/components/client/plans/detail/PlanHeader";
import PlanSummary from "@/components/client/plans/detail/PlanSummary";
import PlanSessionsList from "@/components/client/plans/detail/PlanSessionsList";
import EmptyPlanState from "@/components/client/plans/detail/EmptyPlanState";
import { useToast } from "@/hooks/use-toast";

const ClientPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan, loading, clientId, refreshPlanDetails } = useClientPlanDetail(id);

  const handleSessionDateUpdate = useCallback((sessionId: string, newDate: string | null) => {
    if (!plan) return;
    
    console.log("Manejando actualización de fecha en ClientPlanDetail:", { sessionId, newDate });
    
    // Local state update for UI (the DB update is done in SessionDatePicker)
    const updatedPlan = {...plan};
    const sessionIndex = updatedPlan.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      updatedPlan.sessions[sessionIndex].scheduledDate = newDate;
      
      // Force a refresh of data from the server
      refreshPlanDetails();
    }
  }, [plan, refreshPlanDetails]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!clientId) {
    return <ClientAuthError message="Necesitas iniciar sesión para ver los detalles del plan" />;
  }

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
        
        {!plan ? (
          <Card className="shadow-md">
            <EmptyPlanState />
          </Card>
        ) : (
          <Card className="shadow-md">
            <PlanHeader 
              name={plan.name} 
              createdAt={plan.createdAt} 
              month={plan.month} 
            />
            
            <CardContent>
              <PlanSummary plan={plan} />
              
              <PlanSessionsList 
                sessions={plan.sessions}
                onSessionDateUpdate={handleSessionDateUpdate}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientPlanDetail;
