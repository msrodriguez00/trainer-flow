
export type Category = 
  | "strength" 
  | "cardio" 
  | "flexibility" 
  | "balance" 
  | "core";

export type Level = {
  level: number;
  video: string;
  repetitions: number;
  weight: number;
};

export type Exercise = {
  id: string;
  name: string;
  categories: Category[];
  levels: Level[];
};

export type Evaluation = {
  timeRating: number;
  weightRating: number;
  repetitionsRating: number;
  exerciseRating: number;
  comment: string;
  date: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
};

export type PlanExercise = {
  exerciseId: string;
  exerciseName?: string;
  level: number;
  evaluations: Evaluation[];
};

export type Series = {
  id: string;
  name: string;
  orderIndex: number;
  exercises: PlanExercise[];
};

export type Session = {
  id: string;
  name: string;
  orderIndex: number;
  series: Series[];
};

export type Plan = {
  id: string;
  name: string;
  clientId: string;
  sessions: Session[];
  exercises: PlanExercise[];  // Para mantener compatibilidad hacia atrás
  createdAt: string;
  month?: string;  // Campo de mes (opcional)
};
