
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface ExercisesHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateExercise: () => void;
}

const ExercisesHeader = ({ 
  searchTerm, 
  onSearchChange, 
  onCreateExercise 
}: ExercisesHeaderProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Ejercicios</h1>
        <Button onClick={onCreateExercise}>
          <Plus className="mr-2 h-4 w-4" /> Crear Ejercicio
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          placeholder="Buscar ejercicios por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </>
  );
};

export default ExercisesHeader;
