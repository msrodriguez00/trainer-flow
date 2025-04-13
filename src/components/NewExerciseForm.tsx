
import { useState } from "react";
import { Exercise, Category, Level } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Minus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  initialExercise?: Exercise;
}

const categories: { value: Category; label: string }[] = [
  { value: "strength", label: "Fuerza" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibilidad" },
  { value: "balance", label: "Equilibrio" },
  { value: "core", label: "Core" },
];

// Expresión regular para validar URLs de YouTube
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(?:embed\/|v\/|watch\?v=)|youtu\.be\/)([\w-]{11})(\S*)?$/;

const NewExerciseForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialExercise,
}: NewExerciseFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialExercise?.name || "");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    initialExercise?.categories || []
  );
  const [levels, setLevels] = useState<Omit<Level, "level">[]>(
    initialExercise?.levels.map((l) => ({
      video: l.video,
      repetitions: l.repetitions,
      weight: l.weight,
    })) || [{ video: "", repetitions: 0, weight: 0 }]
  );
  const [videoErrors, setVideoErrors] = useState<boolean[]>(
    initialExercise?.levels.map(() => false) || [false]
  );

  const handleCategoryChange = (category: Category, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    }
  };

  const validateYoutubeUrl = (url: string): boolean => {
    if (!url) return true; // Si está vacío, permitimos continuar (no obligatorio)
    return youtubeRegex.test(url);
  };

  const updateLevel = (index: number, field: keyof Omit<Level, "level">, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: typeof value === "string" && field !== "video" ? parseInt(value) || 0 : value,
    };
    setLevels(newLevels);

    // Validar URL de YouTube si el campo es video
    if (field === "video") {
      const newErrors = [...videoErrors];
      newErrors[index] = !validateYoutubeUrl(value as string);
      setVideoErrors(newErrors);
    }
  };

  const addLevel = () => {
    setLevels([...levels, { video: "", repetitions: 0, weight: 0 }]);
    setVideoErrors([...videoErrors, false]);
  };

  const removeLevel = (index: number) => {
    if (levels.length > 1) {
      setLevels(levels.filter((_, i) => i !== index));
      setVideoErrors(videoErrors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!name || selectedCategories.length === 0) {
      toast({
        title: "Error",
        description: "Completa el nombre y selecciona al menos una categoría",
        variant: "destructive",
      });
      return;
    }

    // Verificar si hay errores en las URLs de YouTube
    const hasVideoErrors = videoErrors.some(error => error);
    if (hasVideoErrors) {
      toast({
        title: "Error",
        description: "Hay URLs de video inválidas. Solo se permiten enlaces de YouTube.",
        variant: "destructive",
      });
      return;
    }

    const formattedLevels: Level[] = levels.map((level, idx) => ({
      level: idx + 1,
      ...level,
    }));

    onSubmit({
      name,
      categories: selectedCategories,
      levels: formattedLevels,
    });

    resetForm();
  };

  const resetForm = () => {
    if (!initialExercise) {
      setName("");
      setSelectedCategories([]);
      setLevels([{ video: "", repetitions: 0, weight: 0 }]);
      setVideoErrors([false]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialExercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Ejercicio</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sentadillas"
            />
          </div>

          <div className="grid gap-2">
            <Label>Categorías</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div className="flex items-center space-x-2" key={category.value}>
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.value, checked === true)
                    }
                  />
                  <Label htmlFor={`category-${category.value}`}>{category.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Niveles</Label>
            {levels.map((level, idx) => (
              <div
                key={idx}
                className="border p-3 rounded-md space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Nivel {idx + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLevel(idx)}
                    disabled={levels.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`video-${idx}`}>URL del Video (YouTube)</Label>
                  <div className="relative">
                    <Input
                      id={`video-${idx}`}
                      value={level.video}
                      onChange={(e) => updateLevel(idx, "video", e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={videoErrors[idx] ? "border-red-500 pr-10" : ""}
                    />
                    {videoErrors[idx] && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {videoErrors[idx] && (
                    <p className="text-sm text-red-500">URL inválida. Utiliza un enlace de YouTube</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`rep-${idx}`}>Repeticiones</Label>
                    <Input
                      id={`rep-${idx}`}
                      type="number"
                      value={level.repetitions}
                      onChange={(e) => updateLevel(idx, "repetitions", e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`weight-${idx}`}>Carga (kg)</Label>
                    <Input
                      id={`weight-${idx}`}
                      type="number"
                      value={level.weight}
                      onChange={(e) => updateLevel(idx, "weight", e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              type="button"
              onClick={addLevel}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir nivel
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewExerciseForm;
