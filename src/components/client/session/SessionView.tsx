
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, X } from "lucide-react";
import ExerciseDetails from "./ExerciseDetails";
import SeriesProgress from "./SeriesProgress";
import SessionControls from "./SessionControls";
import SeriesList from "./SeriesList";
import { useToast } from "@/hooks/use-toast";
import { UseSessionResponse } from "@/hooks/client/session/types";

interface SessionViewProps {
  session: UseSessionResponse;
  onExit: () => void;
}

const SessionView: React.FC<SessionViewProps> = ({ session, onExit }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    sessionState,
    activeExercise,
    activeSeries,
    isLastExercise,
    isLastSeries,
    progress,
    completeExercise,
    skipExercise,
    nextExercise,
    previousExercise,
    completeSeries
  } = session;

  // Handle completing a workout
  const handleCompleteExercise = async () => {
    if (!activeExercise) return;
    
    await completeExercise();
    
    toast({
      title: "¡Bien hecho!",
      description: "Ejercicio completado",
      variant: "default" // Changed from "success" to "default"
    });
  };

  // Handle completing a series
  const handleCompleteSeries = async () => {
    if (!activeSeries) return;
    
    await completeSeries();
  };

  // Handle navigation to specific exercise
  const handleSelectExercise = (seriesIndex: number, exerciseIndex: number) => {
    // Update session state with selected indices
    setShowSidebar(false);
  };

  // Current position information
  const currentSeriesIndex = sessionState.progress.currentSeriesIndex + 1;
  const totalSeries = sessionState.series.length;
  const currentExerciseIndex = sessionState.progress.currentExerciseIndex + 1;
  const totalExercises = activeSeries?.exercises.length || 0;

  const isFirstExercise = currentSeriesIndex === 1 && currentExerciseIndex === 1;

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{sessionState.sessionName}</h1>
          
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <List className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="mb-4">
                <SheetTitle>Ejercicios</SheetTitle>
              </SheetHeader>
              <SeriesList
                series={sessionState.series}
                activeSeries={activeSeries}
                activeExerciseId={activeExercise?.id || null}
                onSelectSeries={(seriesIndex) => {
                  // Update session state to this series' first exercise
                  handleSelectExercise(seriesIndex, 0);
                }}
                onSelectExercise={handleSelectExercise}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        <SeriesProgress
          currentSeries={currentSeriesIndex}
          totalSeries={totalSeries}
          currentExercise={currentExerciseIndex}
          totalExercises={totalExercises}
          overallProgress={progress}
          seriesName={activeSeries?.name}
        />
        
        {activeExercise ? (
          <ExerciseDetails exercise={activeExercise} />
        ) : (
          <div className="rounded-lg p-8 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No hay ejercicio seleccionado</p>
          </div>
        )}
        
        <SessionControls
          exercise={activeExercise}
          isFirstExercise={isFirstExercise}
          isLastExercise={isLastExercise}
          isLastSeries={isLastSeries}
          onComplete={handleCompleteExercise}
          onNext={skipExercise}
          onPrevious={previousExercise}
          onCompleteSeries={handleCompleteSeries}
          onExit={onExit}
        />
      </div>
    </div>
  );
};

export default SessionView;
