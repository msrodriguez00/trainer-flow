
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
  const [formKey, setFormKey] = useState(0); // Add a key to force re-render of form
  
  const { 
    exercises, 
    loading, 
    createExercise, 
    updateExercise, 
    deleteExercise 
  } = useExercises();

  // Add logging for component renders and state changes
  useEffect(() => {
    console.log("Exercises page rendered - isFormOpen:", isFormOpen, "editExercise:", editExercise?.id, "formKey:", formKey);
    
    // Cleanup function to ensure we log unmounts
    return () => {
      console.log("Exercises page unmounting");
    };
  }, [isFormOpen, editExercise, formKey]);

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
      return true;
    } catch (error) {
      console.error("Error creating exercise:", error);
      closeForm(); // Close form even on error
      return false;
    }
  };

  const handleEditExercise = useCallback((exercise: Exercise) => {
    console.log("handleEditExercise called with exercise ID:", exercise.id);
    setEditExercise(exercise);
    setIsFormOpen(true);
    setFormKey(prev => prev + 1); // Increment form key to force fresh instance
  }, []);

  const handleUpdateExercise = async (updatedExercise: Omit<Exercise, "id">) => {
    if (!editExercise) {
      console.error("Cannot update exercise - editExercise is undefined");
      return false;
    }
    
    console.log("handleUpdateExercise called for exercise ID:", editExercise.id);
    
    try {
      await updateExercise(editExercise.id, updatedExercise);
      console.log("Exercise updated successfully");
      closeForm();
      return true;
    } catch (error) {
      console.error("Error updating exercise:", error);
      closeForm(); // Close form even on error
      return false;
    }
  };

  // Use useCallback to prevent unnecessary re-renders
  const closeForm = useCallback(() => {
    console.log("closeForm called - cleaning up form state");
    setIsFormOpen(false);
    
    // Delay resetting the editExercise to prevent race conditions
    setTimeout(() => {
      console.log("Resetting editExercise to undefined");
      setEditExercise(undefined);
      // Increment the key after cleanup to ensure next open gets fresh instance
      setFormKey(prev => prev + 1);
    }, 200);
  }, []);

  const openNewExerciseForm = useCallback(() => {
    console.log("openNewExerciseForm called");
    setEditExercise(undefined);
    setIsFormOpen(true);
    setFormKey(prev => prev + 1); // Increment form key to force fresh instance
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

      {/* Ensure Toaster is present */}
      <Toaster />

      {/* Only render form when needed and with a unique key */}
      {isFormOpen && (
        <NewExerciseForm
          key={`exercise-form-${formKey}`}
          isOpen={isFormOpen}
          onClose={closeForm}
          onSubmit={editExercise ? handleUpdateExercise : handleCreateExercise}
          initialExercise={editExercise}
        />
      )}
    </div>
  );
};

export default Exercises;
