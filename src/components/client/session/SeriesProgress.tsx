
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeriesProgressProps {
  currentSeries: number;
  totalSeries: number;
  currentExercise: number;
  totalExercises: number;
  overallProgress: number;
  seriesName?: string;
}

const SeriesProgress: React.FC<SeriesProgressProps> = ({ 
  currentSeries, 
  totalSeries, 
  currentExercise, 
  totalExercises,
  overallProgress,
  seriesName
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{seriesName || `Serie ${currentSeries}`}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Serie {currentSeries} de {totalSeries}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Ejercicio {currentExercise} de {totalExercises}</span>
            <span>{overallProgress}% Completado</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SeriesProgress;
