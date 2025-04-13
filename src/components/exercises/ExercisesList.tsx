import { Exercise } from "@/types";
import ExerciseCard from "@/components/ExerciseCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import "./ExerciseGrid.css";

interface ExercisesListProps {
  exercises: Exercise[];
  loading: boolean;
  searchTerm: string;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onCreateExercise: () => void;
}

const ExercisesList = ({
  exercises,
  loading,
  searchTerm,
  onEditExercise,
  onDeleteExercise,
  onCreateExercise
}: ExercisesListProps) => {
  if (loading) {
    return (
      <div className="text-center py-10">
        <p>Cargando ejercicios...</p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-medium text-gray-900">
          {searchTerm
            ? "No se encontraron ejercicios"
            : "No hay ejercicios aún"}
        </h3>
        <p className="text-gray-500 mt-1">
          {searchTerm
            ? "Intenta con otra búsqueda"
            : "¡Crea tu primer ejercicio para comenzar!"}
        </p>
        {!searchTerm && (
          <Button className="mt-4" onClick={onCreateExercise}>
            <Plus className="mr-2 h-4 w-4" /> Crear primer ejercicio
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="exercise-grid">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onEdit={onEditExercise}
          onDelete={onDeleteExercise}
        />
      ))}
    </div>
  );
};

export default ExercisesList;
