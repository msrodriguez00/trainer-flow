
import React, { useCallback } from "react";
import { Session } from "@/types";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import SessionDatePicker from "../SessionDatePicker";
import SeriesDetail from "./SeriesDetail";
import { useToast } from "@/hooks/use-toast";

interface SessionAccordionItemProps {
  session: Session;
  onDateUpdated: (sessionId: string, newDate: string | null) => void;
}

export const SessionAccordionItem: React.FC<SessionAccordionItemProps> = ({ 
  session, 
  onDateUpdated 
}) => {
  const { toast } = useToast();
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", {
      locale: es,
    });
  };

  const handleDateUpdate = useCallback((newDate: string | null) => {
    console.log("Fecha actualizada en SessionAccordionItem:", { 
      sessionId: session.id, 
      newDate,
      sessionData: {
        name: session.name,
        currentDate: session.scheduledDate 
      }
    });
    
    // Mostrar confirmación visual inmediata
    if (newDate !== session.scheduledDate) {
      toast({
        title: newDate ? "Fecha programada" : "Fecha eliminada",
        description: newDate 
          ? `Sesión "${session.name}" agendada para ${formatDate(newDate)}` 
          : `Se eliminó la fecha de la sesión "${session.name}"`,
      });
    }
    
    // Propagar la actualización al componente padre
    onDateUpdated(session.id, newDate);
  }, [session, onDateUpdated, toast]);

  return (
    <AccordionItem key={session.id} value={session.id} className="border rounded-lg">
      <AccordionTrigger className="px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4 w-full">
          <div className="font-medium">{session.name}</div>
          {session.scheduledDate && (
            <div className="text-sm text-muted-foreground flex items-center mt-1 md:mt-0">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(session.scheduledDate)}
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Fecha programada:</label>
          <SessionDatePicker 
            sessionId={session.id} 
            initialDate={session.scheduledDate}
            onDateUpdated={handleDateUpdate}
          />
        </div>
        
        {session.series.map((serie) => (
          <SeriesDetail 
            key={serie.id} 
            name={serie.name} 
            exercises={serie.exercises} 
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
};

export default SessionAccordionItem;
