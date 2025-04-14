
import { Plan } from "@/types";

export interface PlanDetailState {
  plan: Plan | null;
  loading: boolean;
}

export interface UsePlanDetailResult {
  plan: Plan | null;
  loading: boolean;
  handleScheduleSession: (sessionId: string, date: Date) => Promise<boolean>;
}

export interface FetchPlanDetailsOptions {
  planId: string;
  clientId: string;
}

export interface ScheduleSessionOptions {
  sessionId: string;
  date: Date;
  clientId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
