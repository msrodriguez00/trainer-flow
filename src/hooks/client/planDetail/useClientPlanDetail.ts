
import { useState, useEffect, useCallback } from "react";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import { fetchPlanDetails } from "./planDetailService";

export const useClientPlanDetail = (planId: string | undefined) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();

  const loadPlanDetails = useCallback(async () => {
    if (!planId || !clientId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const planData = await fetchPlanDetails(planId, clientId);
      setPlan(planData);
    } finally {
      setLoading(false);
    }
  }, [planId, clientId, toast]);

  useEffect(() => {
    if (planId && clientId) {
      loadPlanDetails();
    } else if (!clientLoading && !clientId) {
      setLoading(false);
    }
  }, [planId, clientId, clientLoading, loadPlanDetails]);

  return {
    plan,
    loading,
    clientId,
    refreshPlanDetails: loadPlanDetails
  };
};
