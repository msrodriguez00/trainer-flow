
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Exercise, Client, PlanExercise } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus } from "lucide-react";
import { mockExercises, mockClients } from "@/data/mockData";

interface NewPlanFormProps {
  initialClientId?: string;
  onSubmit: (plan: {
    name: string;
    clientId: string;
    exercises: PlanExercise[];
  }) => void;
}

interface ExerciseSelection {
  exerciseId: string;
  level: number;
}

const NewPlanForm = ({ initialClientId, onSubmit }: NewPlanFormProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [selectedExercises, setSelectedExercises] = useState<ExerciseSelection[]>([
    { exerciseId: "", level: 1 },
  ]);

  // Set initial client ID if provided via props
  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
    }
  }, [initialClientId]);

  const handleAddExercise = () => {
    setSelectedExercises([...selectedExercises, { exerciseId: "", level: 1 }]);
  };

  const handleRemoveExercise = (index: number) => {
    if (selectedExercises.length > 1) {
      setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
    }
  };

  const handleExerciseChange = (index: number, exerciseId: string) => {
    const updated = [...selectedExercises];
    updated[index].exerciseId = exerciseId;
    // Reset level when changing exercise
    updated[index].level = 1;
    setSelectedExercises(updated);
  };

  const handleLevelChange = (index: number, level: number) => {
    const updated = [...selectedExercises];
    updated[index].level = level;
    setSelectedExercises(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !clientId) return;

    // Filter out any incomplete exercise selections
    const validExercises = selectedExercises.filter(
      (ex) => ex.exerciseId && ex.level > 0
    );

    if (validExercises.length === 0) return;

    onSubmit({
      name,
      clientId,
      exercises: validExercises.map((ex) => ({
        ...ex,
        evaluations: [],
      })),
    });
  };

  const getAvailableLevels = (exerciseId: string): number[] => {
    if (!exerciseId) return [1];
    const exercise = mockExercises.find((ex) => ex.id === exerciseId);
    return exercise ? exercise.levels.map((l) => l.level) : [1];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Plan</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Plan</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plan de Fuerza Básico"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {mockClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Ejercicios</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddExercise}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir ejercicio
            </Button>
          </div>

          <div className="space-y-4">
            {selectedExercises.map((selection, index) => {
              const exercise = mockExercises.find(
                (ex) => ex.id === selection.exerciseId
              );
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-grow space-y-2">
                        <Label htmlFor={`exercise-${index}`}>Ejercicio</Label>
                        <Select
                          value={selection.exerciseId}
                          onValueChange={(value) => handleExerciseChange(index, value)}
                          required
                        >
                          <SelectTrigger id={`exercise-${index}`}>
                            <SelectValue placeholder="Seleccionar ejercicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockExercises.map((ex) => (
                              <SelectItem key={ex.id} value={ex.id}>
                                {ex.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selection.exerciseId && (
                        <div className="w-24 space-y-2">
                          <Label htmlFor={`level-${index}`}>Nivel</Label>
                          <Select
                            value={selection.level.toString()}
                            onValueChange={(value) =>
                              handleLevelChange(index, parseInt(value))
                            }
                            required
                          >
                            <SelectTrigger id={`level-${index}`}>
                              <SelectValue placeholder="Nivel" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableLevels(selection.exerciseId).map(
                                (level) => (
                                  <SelectItem key={level} value={level.toString()}>
                                    {level}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => handleRemoveExercise(index)}
                        disabled={selectedExercises.length === 1}
                      >
                        <Trash className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit">Crear Plan</Button>
        </div>
      </form>
    </div>
  );
};

export default NewPlanForm;
