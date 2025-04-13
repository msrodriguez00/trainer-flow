
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Exercise } from "@/types";
import ExerciseCard from "@/components/ExerciseCard";
import NewExerciseForm from "@/components/NewExerciseForm";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Exercises = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, [user]);

  const fetchExercises = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select(`
          id,
          name,
          categories,
          exercise_levels:exercise_levels(
            id,
            level,
            video,
            repetitions,
            weight
          )
        `)
        .order("name");

      if (error) throw error;

      const formattedExercises: Exercise[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories,
        levels: item.exercise_levels.map((level: any) => ({
          level: level.level,
          video: level.video,
          repetitions: level.repetitions,
          weight: level.weight
        }))
      }));

      setExercises(formattedExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ejercicios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.categories.some((cat) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleCreateExercise = async (exercise: Omit<Exercise, "id">) => {
    if (!user) return;
    
    try {
      // First insert the exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .insert({
          name: exercise.name,
          categories: exercise.categories,
          created_by: user.id
        })
        .select()
        .single();

      if (exerciseError) throw exerciseError;

      // Then insert each level
      const levelsToInsert = exercise.levels.map((level, idx) => ({
        exercise_id: exerciseData.id,
        level: idx + 1,
        video: level.video,
        repetitions: level.repetitions,
        weight: level.weight
      }));

      const { error: levelsError } = await supabase
        .from("exercise_levels")
        .insert(levelsToInsert);

      if (levelsError) throw levelsError;

      toast({
        title: "Ejercicio creado",
        description: `Se ha añadido "${exercise.name}" a tus ejercicios.`,
      });
      
      fetchExercises(); // Refresh the list
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el ejercicio.",
        variant: "destructive",
      });
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditExercise(exercise);
    setIsFormOpen(true);
  };

  const handleUpdateExercise = async (updatedExercise: Omit<Exercise, "id">) => {
    if (!editExercise || !user) return;
    
    try {
      console.log("Updating exercise:", editExercise.id, updatedExercise);
      
      // Step 1: Update the exercise basic info
      const { error: exerciseError } = await supabase
        .from("exercises")
        .update({
          name: updatedExercise.name,
          categories: updatedExercise.categories
        })
        .eq("id", editExercise.id);

      if (exerciseError) throw exerciseError;
      
      // Step 2: Delete existing levels one by one
      for (const level of editExercise.levels) {
        if (typeof level.id === 'string') {
          const { error: deleteError } = await supabase
            .from("exercise_levels")
            .delete()
            .eq("id", level.id);
          
          if (deleteError) throw deleteError;
        }
      }

      // Step 3: Insert new levels one by one
      for (let i = 0; i < updatedExercise.levels.length; i++) {
        const level = updatedExercise.levels[i];
        const { error: insertError } = await supabase
          .from("exercise_levels")
          .insert({
            exercise_id: editExercise.id,
            level: i + 1,
            video: level.video,
            repetitions: level.repetitions,
            weight: level.weight
          });
        
        if (insertError) throw insertError;
      }

      toast({
        title: "Ejercicio actualizado",
        description: `Se ha actualizado "${updatedExercise.name}" correctamente.`,
      });
      
      fetchExercises(); // Refresh the list
      setIsFormOpen(false);
      setEditExercise(undefined);
    } catch (error) {
      console.error("Error updating exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ejercicio.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setExercises(exercises.filter((ex) => ex.id !== id));
      toast({
        title: "Ejercicio eliminado",
        description: "Se ha eliminado el ejercicio correctamente.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el ejercicio.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Ejercicios</h1>
          <Button onClick={() => {
            setEditExercise(undefined);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Crear Ejercicio
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Buscar ejercicios por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p>Cargando ejercicios...</p>
          </div>
        ) : filteredExercises.length > 0 ? (
          <div className="exercise-grid">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={handleEditExercise}
                onDelete={handleDeleteExercise}
              />
            ))}
          </div>
        ) : (
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
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Crear primer ejercicio
              </Button>
            )}
          </div>
        )}
      </main>

      <NewExerciseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditExercise(undefined);
        }}
        onSubmit={editExercise ? handleUpdateExercise : handleCreateExercise}
        initialExercise={editExercise}
      />
    </div>
  );
};

export default Exercises;
