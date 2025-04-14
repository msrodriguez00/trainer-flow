
import { useEffect } from "react";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import { usePlanDetailFetch } from "./usePlanDetailFetch";
import { useSessionScheduler } from "./useSessionScheduler";
import { UsePlanDetailResult } from "./types";

export const usePlanDetail = (planId: string | undefined): UsePlanDetailResult => {
  const { clientId, loading: clientLoading } = useClientIdentification();
  const { planState, setPlanState, fetchPlanDetails } = usePlanDetailFetch();
  const { scheduleSession } = useSessionScheduler();

  useEffect(() => {
    if (planId && clientId) {
      fetchPlanDetails({ planId, clientId });
    } else if (!clientLoading && !clientId) {
      setPlanState(prev => ({ ...prev, loading: false }));
    }
  }, [planId, clientId, clientLoading]);

  const handleScheduleSession = async (sessionId: string, date: Date): Promise<boolean> => {
    if (!clientId) {
      throw new Error("Usuario no autenticado");
    }
    
    try {
      await scheduleSession({
        sessionId,
        date,
        clientId,
        onSuccess: async () => {
          console.log("usePlanDetail - Refrescando datos del plan");
          if (planId) {
            await fetchPlanDetails({ planId, clientId });
          }
        }
      });
      
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    plan: planState.plan,
    loading: planState.loading || clientLoading,
    handleScheduleSession
  };
};

// Re-export the types for convenience
export * from "./types";
