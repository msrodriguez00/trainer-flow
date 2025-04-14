
import { Trainer } from "@/components/client/dashboard/types";

export interface UseTrainerSelectionProps {
  onTrainerChange?: (trainerId: string, trainerName: string, trainerBranding?: any) => void;
}

export interface UseTrainerSelectionReturn {
  trainers: Trainer[];
  loading: boolean;
  selectedTrainerId: string;
  trainerName: string;
  handleTrainerSelect: (trainerId: string) => void;
  loadTrainers: () => Promise<void>;
}
