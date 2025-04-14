
import { TrainingSeries } from "@/hooks/client/session/types";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeriesListProps {
  series: TrainingSeries[];
  activeSeries: TrainingSeries | null;
  activeExerciseId: string | null;
  onSelectSeries: (seriesIndex: number) => void;
  onSelectExercise: (seriesIndex: number, exerciseIndex: number) => void;
}

const SeriesList: React.FC<SeriesListProps> = ({
  series,
  activeSeries,
  activeExerciseId,
  onSelectSeries,
  onSelectExercise
}) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {series.map((seriesItem, seriesIndex) => (
        <AccordionItem key={seriesItem.id} value={seriesItem.id}>
          <AccordionTrigger className="flex hover:no-underline">
            <div className="flex justify-between items-center w-full pr-2">
              <div className="flex items-center gap-2">
                {seriesItem.isCompleted && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                <span>
                  {seriesItem.name}
                </span>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSeries(seriesIndex);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </AccordionTrigger>
          
          <AccordionContent>
            <div className="pl-4 space-y-2">
              {seriesItem.exercises.map((exercise, exerciseIndex) => (
                <div 
                  key={exercise.id} 
                  className={`p-2 rounded flex justify-between items-center ${
                    activeExerciseId === exercise.id ? "bg-secondary/50" : "hover:bg-muted/50"
                  } cursor-pointer`}
                  onClick={() => onSelectExercise(seriesIndex, exerciseIndex)}
                >
                  <div className="flex items-center gap-2">
                    {exercise.isCompleted && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    <span>{exercise.exerciseName}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < exercise.level ? "bg-primary" : "bg-muted"
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default SeriesList;
