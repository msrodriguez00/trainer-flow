
import React from "react";
import { Calendar, Activity } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PlanSummaryProps {
  name: string;
  createdAt: string;
  month?: string;
  sessionCount: number;
  seriesCount: number;
  exercisesCount: number;
}

const PlanSummary: React.FC<PlanSummaryProps> = ({
  name,
  createdAt,
  month,
  sessionCount,
  seriesCount,
  exercisesCount
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  return (
    <>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-4 md:mb-0">
            <CardTitle className="text-2xl">{name}</CardTitle>
            <div className="flex items-center mt-2 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Creado el {formatDate(createdAt)}</span>
            </div>
          </div>
          
          {month && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-4 w-4 mr-2" />
              {month}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Resumen del plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Sesiones</p>
              <p className="text-2xl font-semibold">{sessionCount}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Series</p>
              <p className="text-2xl font-semibold">{seriesCount}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">Ejercicios</p>
              <p className="text-2xl font-semibold">{exercisesCount}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default PlanSummary;
