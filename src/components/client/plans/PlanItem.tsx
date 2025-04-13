
import React from "react";
import { ClipboardList, Activity } from "lucide-react";
import { Plan } from "@/types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
          <h3 className="text-lg font-medium mb-2">Ejercicios ({plan.exercises.length})</h3>
          <div className="space-y-2">
            {plan.exercises.map((exercise, index) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>
                    {exercise.exerciseName || `Ejercicio ${index + 1}`} (Nivel {exercise.level})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlanItem;
