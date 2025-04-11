
import { Exercise, Client, Plan, Evaluation } from "../types";

export const mockExercises: Exercise[] = [
  {
    id: "ex1",
    name: "Sentadillas",
    categories: ["strength", "core"],
    levels: [
      {
        level: 1,
        video: "https://example.com/squat-level1.mp4",
        repetitions: 10,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/squat-level2.mp4",
        repetitions: 15,
        weight: 10,
      },
      {
        level: 3,
        video: "https://example.com/squat-level3.mp4",
        repetitions: 20,
        weight: 20,
      },
    ],
  },
  {
    id: "ex2",
    name: "Push-ups",
    categories: ["strength", "core"],
    levels: [
      {
        level: 1,
        video: "https://example.com/pushup-level1.mp4",
        repetitions: 5,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/pushup-level2.mp4",
        repetitions: 10,
        weight: 0,
      },
      {
        level: 3,
        video: "https://example.com/pushup-level3.mp4",
        repetitions: 15,
        weight: 0,
      },
    ],
  },
  {
    id: "ex3",
    name: "Plank",
    categories: ["core", "balance"],
    levels: [
      {
        level: 1,
        video: "https://example.com/plank-level1.mp4",
        repetitions: 1,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/plank-level2.mp4",
        repetitions: 1,
        weight: 0,
      },
      {
        level: 3,
        video: "https://example.com/plank-level3.mp4",
        repetitions: 1,
        weight: 0,
      },
    ],
  },
  {
    id: "ex4",
    name: "Lunges",
    categories: ["strength", "balance"],
    levels: [
      {
        level: 1,
        video: "https://example.com/lunge-level1.mp4",
        repetitions: 8,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/lunge-level2.mp4",
        repetitions: 12,
        weight: 5,
      },
      {
        level: 3,
        video: "https://example.com/lunge-level3.mp4",
        repetitions: 15,
        weight: 10,
      },
    ],
  },
  {
    id: "ex5",
    name: "Burpees",
    categories: ["cardio", "strength"],
    levels: [
      {
        level: 1,
        video: "https://example.com/burpee-level1.mp4",
        repetitions: 5,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/burpee-level2.mp4",
        repetitions: 10,
        weight: 0,
      },
      {
        level: 3,
        video: "https://example.com/burpee-level3.mp4",
        repetitions: 15,
        weight: 0,
      },
    ],
  },
  {
    id: "ex6",
    name: "Jumping Jacks",
    categories: ["cardio"],
    levels: [
      {
        level: 1,
        video: "https://example.com/jumpingjack-level1.mp4",
        repetitions: 20,
        weight: 0,
      },
      {
        level: 2,
        video: "https://example.com/jumpingjack-level2.mp4",
        repetitions: 30,
        weight: 0,
      },
      {
        level: 3,
        video: "https://example.com/jumpingjack-level3.mp4",
        repetitions: 40,
        weight: 0,
      },
    ],
  },
];

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "Ana García",
    email: "ana@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "c2",
    name: "Carlos Rodríguez",
    email: "carlos@example.com",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "c3",
    name: "Elena López",
    email: "elena@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "c4",
    name: "Marco Díaz",
    email: "marco@example.com",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
];

export const mockEvaluations: Evaluation[] = [
  {
    timeRating: 4,
    weightRating: 3,
    repetitionsRating: 4,
    exerciseRating: 4,
    comment: "Buen rendimiento pero se fatiga rápido",
    date: "2023-04-10T10:30:00Z",
  },
  {
    timeRating: 3,
    weightRating: 4,
    repetitionsRating: 3,
    exerciseRating: 3,
    comment: "Mejorando en peso, necesita trabajar resistencia",
    date: "2023-04-05T11:15:00Z",
  },
];

export const mockPlans: Plan[] = [
  {
    id: "p1",
    name: "Plan de Fuerza Básico",
    clientId: "c1",
    exercises: [
      {
        exerciseId: "ex1",
        level: 2,
        evaluations: [mockEvaluations[0]],
      },
      {
        exerciseId: "ex2",
        level: 1,
        evaluations: [mockEvaluations[1]],
      },
      {
        exerciseId: "ex4",
        level: 1,
        evaluations: [],
      },
    ],
    createdAt: "2023-04-01T09:00:00Z",
  },
  {
    id: "p2",
    name: "Plan Cardio Intermedio",
    clientId: "c2",
    exercises: [
      {
        exerciseId: "ex5",
        level: 2,
        evaluations: [],
      },
      {
        exerciseId: "ex6",
        level: 3,
        evaluations: [],
      },
    ],
    createdAt: "2023-04-02T14:30:00Z",
  },
  {
    id: "p3",
    name: "Plan Core y Balance",
    clientId: "c3",
    exercises: [
      {
        exerciseId: "ex3",
        level: 2,
        evaluations: [],
      },
      {
        exerciseId: "ex4",
        level: 2,
        evaluations: [],
      },
    ],
    createdAt: "2023-04-03T16:45:00Z",
  },
];
