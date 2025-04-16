
import { Plan, Client, Exercise } from "@/types";
import { Session, Series, ExerciseSelection } from "../types";

export interface CreateCompletePlanResponse {
  id: string;
  name: string;
  clientId: string;
  month: string | null;
  sessionsCount: number;
}

export interface PlanFormSubmitResult {
  id: string;
  name: string;
  clientId: string;
  month?: string;
  exercises: {
    exerciseId: string;
    level: number;
    evaluations: any[];
  }[];
  sessions: Session[];
}

export interface PlanFormProps {
  initialClientId?: string;
  onSubmit?: (plan: PlanFormSubmitResult) => void;
}
