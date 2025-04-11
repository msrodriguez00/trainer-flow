
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockExercises } from "@/data/mockData";
import { Exercise } from "@/types";
import ExerciseCard from "@/components/ExerciseCard";
import NewExerciseForm from "@/components/NewExerciseForm";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Exercises = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | undefined>(undefined);

  const filteredExercises = exercises.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.categories.some((cat) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleCreateExercise = (exercise: Omit<Exercise, "id">) => {
    const newExercise: Exercise = {
      id: `ex${exercises.length + 1}`,
      ...exercise,
    };

    setExercises([...exercises, newExercise]);
    setIsFormOpen(false);
    toast({
      title: "Ejercicio creado",
      description: `Se ha añadido "${newExercise.name}" a tus ejercicios.`,
    });
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditExercise(exercise);
    setIsFormOpen(true);
  };

  const handleUpdateExercise = (updatedExercise: Omit<Exercise, "id">) => {
    if (!editExercise) return;
    
    const updated = exercises.map((ex) =>
      ex.id === editExercise.id
        ? { ...updatedExercise, id: editExercise.id }
        : ex
    );
    
    setExercises(updated);
    setIsFormOpen(false);
    setEditExercise(undefined);
    toast({
      title: "Ejercicio actualizado",
      description: `Se ha actualizado "${updatedExercise.name}" correctamente.`,
    });
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
    toast({
      title: "Ejercicio eliminado",
      description: "Se ha eliminado el ejercicio correctamente.",
      variant: "destructive",
    });
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

        {filteredExercises.length > 0 ? (
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
