
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockExercises } from "@/data/mockData";
import { Exercise, Category } from "@/types";
import ExerciseCard from "@/components/ExerciseCard";
import NewExerciseForm from "@/components/NewExerciseForm";
import { Plus, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

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

  const handleCreateExercise = (exercise: Omit<Exercise, "id">) => {
    const newExercise: Exercise = {
      id: `ex${exercises.length + 1}`,
      ...exercise,
    };

    setExercises([...exercises, newExercise]);
    setIsFormOpen(false);
    toast({
      title: "Ejercicio creado",
      description: `Se ha añadido "${newExercise.name}" a tu biblioteca.`,
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
      description: "Se ha eliminado el ejercicio de tu biblioteca.",
      variant: "destructive",
    });
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
