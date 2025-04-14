
import { Button } from "@/components/ui/button";
import { 
  SkipBack, 
  SkipForward, 
  CheckCircle, 
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { TrainingExercise } from "@/hooks/client/session/types";

interface SessionControlsProps {
  exercise: TrainingExercise | null;
  isFirstExercise: boolean;
  isLastExercise: boolean;
  isLastSeries: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onCompleteSeries: () => void;
  onExit: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  exercise,
  isFirstExercise,
  isLastExercise,
  isLastSeries,
  onComplete,
  onNext,
  onPrevious,
  onCompleteSeries,
  onExit
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={onPrevious} 
          variant="outline" 
          disabled={isFirstExercise}
          className="flex items-center justify-center"
        >
          <SkipBack className="h-5 w-5 mr-1" />
          Anterior
        </Button>
        
        <Button 
          onClick={onNext} 
          variant="outline"
          className="flex items-center justify-center"
        >
          Siguiente
          <SkipForward className="h-5 w-5 ml-1" />
        </Button>
      </div>
      
      <Button 
        onClick={onComplete} 
        variant="default" 
        className="w-full flex items-center justify-center"
        disabled={!exercise || exercise.isCompleted}
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        {exercise?.isCompleted ? "Ejercicio Completado" : "Completar Ejercicio"}
      </Button>
      
      {isLastExercise && !isLastSeries && (
        <Button 
          onClick={onCompleteSeries} 
          variant="secondary"
          className="w-full flex items-center justify-center"
        >
          Completar Serie y Continuar
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      )}
      
      <Button 
        onClick={onExit} 
        variant="ghost" 
        className="flex items-center justify-center"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Salir
      </Button>
    </div>
  );
};

export default SessionControls;
