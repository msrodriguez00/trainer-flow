
import { Exercise, Client } from "@/types";

export interface ExerciseSelection {
  exerciseId: string;
  level: number;
  sessionId: string;
  seriesId: string;
}

export interface Series {
  id: string;
  name: string;
  exercises: ExerciseSelection[];
}

export interface Session {
  id: string;
  name: string;
  series: Series[];
}

export interface PlanFormState {
  name: string;
  clientId: string;
  month: string;
  sessions: Session[];
}

export interface UsePlanFormResult {
  name: string;
  setName: (name: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  month: string;
  setMonth: (month: string) => void;
  clients: Client[];
  exercises: Exercise[];
  sessions: Session[];
  loading: boolean;
  
  addSession: () => void;
  removeSession: (index: number) => void;
  updateSessionName: (index: number, name: string) => void;
  
  addSeries: (sessionIndex: number) => void;
  removeSeries: (sessionIndex: number, seriesIndex: number) => void;
  updateSeriesName: (sessionIndex: number, seriesIndex: number, name: string) => void;
  
  addExerciseToSeries: (sessionIndex: number, seriesIndex: number) => void;
  removeExerciseFromSeries: (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => void;
  handleExerciseChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => void;
  handleLevelChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => void;
  
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}
