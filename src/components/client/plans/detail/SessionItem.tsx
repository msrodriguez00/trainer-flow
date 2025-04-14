
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import SeriesSection from "./SeriesSection";
import SessionCalendarButton from "./SessionCalendarButton";

interface Series {
  id: string;
  name: string;
  orderIndex: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    level: number;
    evaluations: any[];
  }>;
}

interface SessionProps {
  id: string;
  name: string;
  orderIndex: number;
  scheduledDate?: string;
  series: Series[];
  onScheduleSession: (sessionId: string, date: Date) => Promise<void>;
}

const formatScheduledDate = (dateString: string | undefined) => {
  if (!dateString) return null;
  return format(new Date(dateString), "d 'de' MMMM, yyyy", {
    locale: es,
  });
};

const SessionItem: React.FC<SessionProps> = ({ 
  id, 
  name, 
  scheduledDate, 
  series, 
  onScheduleSession 
}) => {
  return (
    <Card key={id} className="border overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-muted/10">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-lg">{name}</h4>
        </div>
        
        <SessionCalendarButton 
          sessionId={id}
          scheduledDate={scheduledDate}
          onScheduleSession={onScheduleSession}
        />
      </div>
      
      <Accordion type="single" collapsible>
        <AccordionItem value={id} className="border-0">
          <AccordionTrigger className="px-4 py-2">
            <span className="text-sm">Ver detalles de la sesión</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {scheduledDate && (
              <div className="mb-4 p-3 bg-primary/5 rounded-md">
                <p className="text-sm flex items-center font-medium">
                  <CalendarClock className="h-4 w-4 mr-2 text-primary" />
                  Fecha programada: {formatScheduledDate(scheduledDate)}
                </p>
              </div>
            )}
            
            {series.map((serie) => (
              <SeriesSection 
                key={serie.id} 
                id={serie.id} 
                name={serie.name} 
                orderIndex={serie.orderIndex} 
                exercises={serie.exercises} 
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default SessionItem;
