
import React, { useState } from "react";
import { Exercise, PlanExercise, Level, Evaluation } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronDown, 
  ChevronUp,
  Dumbbell, 
  Video, 
  Activity,
  BarChart3,
  MessageSquareText,
  PlusCircle, 
  Star 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PlanExerciseCardProps {
  exercise: Exercise;
  planExercise: PlanExercise;
  planId: string;
  onUpdate: () => void;
}

const categoryIcons: Record<string, JSX.Element> = {
  strength: <Dumbbell className="h-3 w-3" />,
  cardio: <Activity className="h-3 w-3" />,
  flexibility: <Activity className="h-3 w-3" />,
  balance: <Activity className="h-3 w-3" />,
  core: <Activity className="h-3 w-3" />,
};

const StarRating = ({ 
  value, 
  onChange, 
  readOnly = false 
}: { 
  value: number; 
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          className={`${readOnly ? "cursor-default" : "cursor-pointer"} focus:outline-none`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const PlanExerciseCard: React.FC<PlanExerciseCardProps> = ({
  exercise,
  planExercise,
  planId,
  onUpdate
}) => {
  const [expanded, setExpanded] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState<Partial<Evaluation>>({
    timeRating: 0,
    weightRating: 0,
    repetitionsRating: 0,
    exerciseRating: 0,
    comment: ""
  });

  const level = exercise.levels.find(l => l.level === planExercise.level);
  
  const handleAddEvaluation = async () => {
    try {
      // 1. First get the plan_exercise ID
      const { data: planExerciseData, error: planExerciseError } = await supabase
        .from("plan_exercises")
        .select("id")
        .eq("plan_id", planId)
        .eq("exercise_id", exercise.id)
        .single();

      if (planExerciseError) throw planExerciseError;

      // 2. Insert the evaluation
      const { error: evaluationError } = await supabase
        .from("evaluations")
        .insert({
          plan_exercise_id: planExerciseData.id,
          time_rating: newEvaluation.timeRating,
          weight_rating: newEvaluation.weightRating,
          repetitions_rating: newEvaluation.repetitionsRating,
          exercise_rating: newEvaluation.exerciseRating,
          comment: newEvaluation.comment,
          date: new Date().toISOString()
        });

      if (evaluationError) throw evaluationError;

      toast.success("Evaluación guardada correctamente");
      setEvaluationDialogOpen(false);
      setNewEvaluation({
        timeRating: 0,
        weightRating: 0,
        repetitionsRating: 0,
        exerciseRating: 0,
        comment: ""
      });
      onUpdate();
    } catch (error) {
      console.error("Error adding evaluation:", error);
      toast.error("Error al guardar la evaluación");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-xl">{exercise.name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.categories.map((category) => (
                  <Badge key={category} variant="outline" className="flex gap-1 items-center">
                    {categoryIcons[category]}
                    <span className="capitalize">{category}</span>
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {level && (
            <div className="bg-secondary/20 p-3 rounded-md mb-4">
              <h3 className="font-medium mb-2">Nivel {level.level}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Repeticiones:</p>
                  <p className="font-medium">{level.repetitions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso (kg):</p>
                  <p className="font-medium">{level.weight}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Video:</p>
                  <a
                    href={level.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    <Video className="h-4 w-4 mr-1" /> Ver demostración
                  </a>
                </div>
              </div>
            </div>
          )}

          {expanded && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Evaluaciones</h3>
                <Button 
                  size="sm" 
                  onClick={() => setEvaluationDialogOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Añadir Evaluación
                </Button>
              </div>

              {planExercise.evaluations.length > 0 ? (
                <div className="space-y-4">
                  {planExercise.evaluations.map((evaluation, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm text-gray-500">
                          {format(new Date(evaluation.date), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Tiempo:</span>
                            <StarRating value={evaluation.timeRating} readOnly />
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Peso:</span>
                            <StarRating value={evaluation.weightRating} readOnly />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Repeticiones:</span>
                            <StarRating value={evaluation.repetitionsRating} readOnly />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">General:</span>
                            <StarRating value={evaluation.exerciseRating} readOnly />
                          </div>
                        </div>
                      </div>

                      {evaluation.comment && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Comentario:</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            {evaluation.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <MessageSquareText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No hay evaluaciones para este ejercicio</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Evaluación</DialogTitle>
            <DialogDescription>
              Evalúa el desempeño en este ejercicio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiempo</label>
                <StarRating 
                  value={newEvaluation.timeRating || 0}
                  onChange={(val) => setNewEvaluation({...newEvaluation, timeRating: val})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Peso</label>
                <StarRating 
                  value={newEvaluation.weightRating || 0}
                  onChange={(val) => setNewEvaluation({...newEvaluation, weightRating: val})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Repeticiones</label>
                <StarRating 
                  value={newEvaluation.repetitionsRating || 0}
                  onChange={(val) => setNewEvaluation({...newEvaluation, repetitionsRating: val})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Evaluación General</label>
                <StarRating 
                  value={newEvaluation.exerciseRating || 0}
                  onChange={(val) => setNewEvaluation({...newEvaluation, exerciseRating: val})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Comentario</label>
              <Textarea 
                value={newEvaluation.comment || ''}
                onChange={(e) => setNewEvaluation({...newEvaluation, comment: e.target.value})}
                placeholder="Añade comentarios o notas sobre el desempeño" 
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvaluation}>
              Guardar Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanExerciseCard;
