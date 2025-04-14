
import React from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CardTitle, CardHeader } from "@/components/ui/card";

interface PlanHeaderProps {
  name: string;
  createdAt: string;
  month?: string | null;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({ name, createdAt, month }) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  return (
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
  );
};

export default PlanHeader;
