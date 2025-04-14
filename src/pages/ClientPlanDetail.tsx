
import { useState, useCallback, useEffect } from "react";
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
  
  // Add a state to track if a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to handle data refresh with debounce 
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log("Solicitando actualización de datos del plan desde servidor");
    
    try {
      await refreshPlanDetails();
    } catch (error) {
      console.error("Error al actualizar datos del plan:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos del plan",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPlanDetails, isRefreshing, toast]);

  const handleSessionDateUpdate = useCallback((sessionId: string, newDate: string | null) => {
    if (!plan) return;
    
    console.log("Manejando actualización de fecha en ClientPlanDetail:", { 
      sessionId, 
      newDate,
      planId: id,
      sessionCount: plan.sessions?.length || 0
    });
    
    // Local state update for UI (the DB update is done in SessionDatePicker)
    const updatedPlan = {...plan};
    const sessionIndex = updatedPlan.sessions.findIndex(s => s.id === sessionId);
    
    console.log("Índice de sesión encontrado:", sessionIndex);
    
    if (sessionIndex !== -1) {
      console.log("Estado antes de actualización:", {
        fechaAnterior: updatedPlan.sessions[sessionIndex].scheduledDate
      });
      
      updatedPlan.sessions[sessionIndex].scheduledDate = newDate;
      
      console.log("Estado después de actualización:", {
        fechaNueva: updatedPlan.sessions[sessionIndex].scheduledDate
      });
      
      // Force a refresh of data from the server to ensure we have the latest data
      handleRefresh();
    }
  }, [plan, id, handleRefresh]);

  // Auto-refresh data when component mounts
  useEffect(() => {
    if (plan) {
      const refreshTimeout = setTimeout(() => {
        handleRefresh();
      }, 1000); // Refresh after 1 second to ensure UI is settled

      return () => clearTimeout(refreshTimeout);
    }
  }, [plan?.id]); // Only run when plan ID changes, not on every re-render

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
