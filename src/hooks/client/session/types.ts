
import { PlanExercise, Series } from "@/types";

// Extended version of PlanExercise with session-specific fields
export interface TrainingExercise extends Omit<PlanExercise, 'exerciseId'> {
  isCompleted: boolean;
  videoUrl: string;
  id: string;
  exerciseId: string;
  repetitions: number;
  weight: number;
}

export interface TrainingSeries extends Omit<Series, 'exercises'> {
  exercises: TrainingExercise[];
  isCompleted: boolean;
}

export interface SessionProgress {
  currentSeriesIndex: number;
  currentExerciseIndex: number;
  completedExercises: string[]; // IDs of completed exercises
  completedSeries: string[]; // IDs of completed series
}

export interface SessionState {
  sessionId: string;
  sessionName: string;
  series: TrainingSeries[];
  progress: SessionProgress;
  loading: boolean;
  error: string | null;
}

export interface UseSessionResponse {
  sessionState: SessionState;
  activeExercise: TrainingExercise | null;
  activeSeries: TrainingSeries | null;
  isLastExercise: boolean;
  isLastSeries: boolean;
  progress: number; // Percentage complete
  completeExercise: () => Promise<void>;
  skipExercise: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  completeSeries: () => Promise<void>;
}

export interface SessionData {
  id: string;
  name: string;
  series: Series[];
}
