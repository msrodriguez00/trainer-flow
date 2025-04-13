import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Exercise, Category } from "@/types";
import ExerciseCard from "@/components/ExerciseCard";
import NewExerciseForm from "@/components/NewExerciseForm";
import { Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryLabels: Record<Category, string> = {
  "strength": "Fuerza",
  "cardio": "Cardio",
  "flexibility": "Flexibilidad",
  "balance": "Equilibrio",
  "core": "Core"
};

const ExerciseLibrary = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
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
          levels
        `)
        .order("name");

      if (error) throw error;

      const formattedExercises: Exercise[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        categories: item.categories,
        levels: item.levels.map((level: any) => ({
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
    (exercise) => {
      // Filter by search term
      const matchesSearch = 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.categories.some((cat) =>
          cat.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Filter by selected categories
      const matchesCategory = 
        selectedCategories.length === 0 || 
        exercise.categories.some(cat => selectedCategories.includes(cat));

      return matchesSearch && matchesCategory;
    }
  );

  const handleCreateExercise = async (exercise: Omit<Exercise, "id">) => {
    if (!user) return;
    
    try {
      // Insert exercise with levels directly in JSON field
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          name: exercise.name,
          categories: exercise.categories,
          created_by: user.id,
          levels: exercise.levels.map((level, idx) => ({
            level: idx + 1,
            video: level.video,
            repetitions: level.repetitions,
            weight: level.weight
          }))
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ejercicio creado",
        description: `Se ha añadido "${exercise.name}" a tu biblioteca.`,
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
      // Update exercise with levels directly in JSON field
      const { error } = await supabase
        .from("exercises")
        .update({
          name: updatedExercise.name,
          categories: updatedExercise.categories,
          levels: updatedExercise.levels.map((level, idx) => ({
            level: idx + 1,
            video: level.video,
            repetitions: level.repetitions,
            weight: level.weight
          }))
        })
        .eq("id", editExercise.id);

      if (error) throw error;

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
        description: "Se ha eliminado el ejercicio de tu biblioteca.",
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

  const toggleCategory = (category: Category) => {
    setSelectedCategories(current => 
      current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };

  const categoriesArray = Object.entries(categoryLabels) as [Category, string][];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Biblioteca de Ejercicios</h1>
          <Button onClick={() => {
            setEditExercise(undefined);
            setIsFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Crear Ejercicio
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Buscar ejercicios por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {categoriesArray.map(([category, label]) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              {searchTerm || selectedCategories.length > 0
                ? "No se encontraron ejercicios"
                : "No hay ejercicios en tu biblioteca"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm || selectedCategories.length > 0
                ? "Intenta con otra búsqueda o filtros"
                : "¡Crea tu primer ejercicio para comenzar!"}
            </p>
            {!searchTerm && selectedCategories.length === 0 && (
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

export default ExerciseLibrary;
