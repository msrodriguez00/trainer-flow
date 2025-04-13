
import { useState, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Exercise } from "@/types";
import NewExerciseForm from "@/components/exercises/NewExerciseForm";
import { useExercises } from "@/hooks/useExercises";
import ExercisesHeader from "@/components/exercises/ExercisesHeader";
import ExercisesList from "@/components/exercises/ExercisesList";
import { Toaster } from "@/components/ui/toaster";

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

  // Add logging for component renders and state changes
  useEffect(() => {
    console.log("Exercises page rendered - isFormOpen:", isFormOpen, "editExercise:", editExercise?.id);
    
    // Cleanup function to ensure we log unmounts
    return () => {
      console.log("Exercises page unmounting");
    };
  }, [isFormOpen, editExercise]);

  const filteredExercises = exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.categories.some((cat) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleCreateExercise = async (exercise: Omit<Exercise, "id">) => {
    console.log("handleCreateExercise called with:", exercise);
    try {
      await createExercise(exercise);
      console.log("Exercise created successfully");
      closeForm();
    } catch (error) {
      console.error("Error creating exercise:", error);
      closeForm(); // Close form even on error
    }
  };

  const handleEditExercise = useCallback((exercise: Exercise) => {
    console.log("handleEditExercise called with exercise ID:", exercise.id);
    setEditExercise(exercise);
    setIsFormOpen(true);
  }, []);

  const handleUpdateExercise = async (updatedExercise: Omit<Exercise, "id">) => {
    if (!editExercise) {
      console.error("Cannot update exercise - editExercise is undefined");
      return;
    }
    
    console.log("handleUpdateExercise called for exercise ID:", editExercise.id);
    
    try {
      await updateExercise(editExercise.id, updatedExercise);
      console.log("Exercise updated successfully");
      closeForm();
    } catch (error) {
      console.error("Error updating exercise:", error);
      closeForm(); // Close form even on error
    }
  };

  // Use useCallback to prevent unnecessary re-renders
  const closeForm = useCallback(() => {
    console.log("closeForm called - cleaning up form state");
    setIsFormOpen(false);
    
    // Use setTimeout to ensure state updates don't conflict
    setTimeout(() => {
      console.log("Resetting editExercise to undefined");
      setEditExercise(undefined);
    }, 100);
  }, []);

  const openNewExerciseForm = useCallback(() => {
    console.log("openNewExerciseForm called");
    setEditExercise(undefined);
    setIsFormOpen(true);
  }, []);

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

      {/* Add Toaster component */}
      <Toaster />

      {/* Use key to force re-render of form when it reopens */}
      <NewExerciseForm
        key={`exercise-form-${isFormOpen ? 'open' : 'closed'}-${editExercise?.id || 'new'}`}
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editExercise ? handleUpdateExercise : handleCreateExercise}
        initialExercise={editExercise}
      />
    </div>
  );
};

export default Exercises;
