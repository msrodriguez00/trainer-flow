
import { Category } from "@/types";

export const EXERCISE_CATEGORIES: { value: Category; label: string }[] = [
  { value: "strength", label: "Fuerza" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibilidad" },
  { value: "balance", label: "Equilibrio" },
  { value: "core", label: "Core" },
];

// Expresión regular para validar URLs de YouTube
export const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([\w-]{11})(\S*)?$/;
