
// Client types
export type Client = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  trainer_id?: string;
  created_at?: string;
  avatar_url?: string;
};

// Exercise types
export type Exercise = {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  category_id?: string;
  trainer_id?: string;
  category?: Category;
  levels?: Level[];
  created_at?: string;
};

export type Category = {
  id: string;
  name: string;
  trainer_id?: string;
};

export type Level = {
  id: string;
  name: string;
  exercise_id: string;
  description?: string;
  video_url?: string;
};

// Plan types
export type Plan = {
  id: string;
  name: string;
  clientId: string;
  createdAt: string;
  month?: string;
  sessions: Session[];
  exercises: PlanExercise[];
};

export type Session = {
  id: string;
  name: string;
  orderIndex: number;
  series: Series[];
  scheduledDate?: string;
};

export type Series = {
  id: string;
  name: string;
  orderIndex: number;
  exercises: PlanExercise[];
};

export type PlanExercise = {
  exerciseId: string;
  exerciseName: string;
  level: number;
  evaluations?: Evaluation[];
  sessionId?: string;
  seriesId?: string;
};

export type Evaluation = {
  timeRating?: number;
  weightRating?: number;
  repetitionsRating?: number;
  exerciseRating?: number;
  comment?: string;
  date?: string;
};
