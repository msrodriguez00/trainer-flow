
import React from "react";
import { ClipboardList, Activity, Layers, FolderKanban } from "lucide-react";
import { Plan } from "@/types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PlanItemProps {
  plan: Plan;
}

export const PlanItem: React.FC<PlanItemProps> = ({ plan }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calcular el número total de ejercicios en todo el plan
  const totalExercises = plan.sessions.reduce((total, session) => {
    return total + session.series.reduce((seriesTotal, series) => {
      return seriesTotal + series.exercises.length;
    }, 0);
  }, 0);
  
  return (
    <Sheet key={plan.id}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
        >
          <div className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>{plan.name}</span>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{plan.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <div className="mb-4 text-sm text-gray-500">
            Creado: {formatDate(plan.createdAt)}
          </div>
          
          <h3 className="text-lg font-medium mb-2">Sesiones ({plan.sessions.length})</h3>
          
          <Accordion type="single" collapsible className="space-y-2">
            {plan.sessions.map((session, sessionIndex) => (
              <AccordionItem key={session.id} value={`session-${sessionIndex}`} className="border rounded-md">
                <AccordionTrigger className="px-3 py-2">
                  <div className="flex items-center">
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span>{session.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-2">
                  <div className="space-y-3 pl-2">
                    {session.series.map((serie, serieIndex) => (
                      <div key={serie.id} className="border-l-2 border-gray-200 pl-3">
                        <h4 className="flex items-center text-sm font-medium mb-2">
                          <Layers className="mr-2 h-4 w-4" />
                          {serie.name} ({serie.exercises.length} ejercicios)
                        </h4>
                        <div className="space-y-2 pl-2">
                          {serie.exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="p-2 border rounded-md bg-gray-50">
                              <div className="flex items-center">
                                <Activity className="mr-2 h-4 w-4 text-primary" />
                                <span>
                                  {exercise.exerciseName || `Ejercicio ${exerciseIndex + 1}`} (Nivel {exercise.level})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {totalExercises === 0 && (
            <div className="text-center p-4 border rounded-md mt-4">
              <p className="text-gray-500">Este plan no contiene ejercicios.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlanItem;
