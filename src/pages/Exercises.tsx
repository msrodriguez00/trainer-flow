
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Exercise } from "@/types";
import NewExerciseForm from "@/components/exercises/NewExerciseForm";
import { useExercises } from "@/hooks/useExercises";
import ExercisesHeader from "@/components/exercises/ExercisesHeader";
import ExercisesList from "@/components/exercises/ExercisesList";

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | undefined>(undefined);
  
  const { 
    exercises, 
    loading, 
    createExercise, 
    updateExercise, 
    deleteExercise 
  } = useExercises();

  const filteredExercises = exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.categories.some((cat) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleCreateExercise = async (exercise: Omit<Exercise, "id">) => {
    const success = await createExercise(exercise);
    if (success) {
      closeForm();
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditExercise(exercise);
    setIsFormOpen(true);
  };

  const handleUpdateExercise = async (updatedExercise: Omit<Exercise, "id">) => {
    if (!editExercise) return;
    
    const success = await updateExercise(editExercise.id, updatedExercise);
    if (success) {
      closeForm();
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditExercise(undefined);
  };

  const openNewExerciseForm = () => {
    setEditExercise(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <ExercisesHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateExercise={openNewExerciseForm}
        />

        <ExercisesList 
          exercises={filteredExercises}
          loading={loading}
          searchTerm={searchTerm}
          onEditExercise={handleEditExercise}
          onDeleteExercise={deleteExercise}
          onCreateExercise={openNewExerciseForm}
        />
      </main>

      <NewExerciseForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editExercise ? handleUpdateExercise : handleCreateExercise}
        initialExercise={editExercise}
      />
    </div>
  );
};

export default Exercises;
