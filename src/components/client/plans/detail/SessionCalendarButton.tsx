
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface SessionCalendarButtonProps {
  sessionId: string;
  scheduledDate: string | null | undefined;
  onScheduleSession: (sessionId: string, date: Date) => Promise<void>;
}

const SessionCalendarButton: React.FC<SessionCalendarButtonProps> = ({ 
  sessionId, 
  scheduledDate, 
  onScheduleSession 
}) => {
  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      try {
        await onScheduleSession(sessionId, date);
      } catch (error) {
        console.error("Error scheduling session:", error);
      }
    }
  };

  return (
    <div className="mt-2 md:mt-0 flex items-center">
      {scheduledDate ? (
        <Badge variant="outline" className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          <span>
            {format(new Date(scheduledDate), "d MMM yyyy", { locale: es })}
          </span>
        </Badge>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center">
          <CalendarClock className="h-3 w-3 mr-1" />
          <span>Sin fecha programada</span>
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">
            <Calendar className="h-4 w-4 mr-1" />
            {scheduledDate ? "Cambiar fecha" : "Programar"}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-1">
            <h5 className="text-sm font-medium mb-2">Selecciona una fecha</h5>
            <CalendarComponent
              mode="single"
              selected={scheduledDate ? new Date(scheduledDate) : undefined}
              onSelect={handleDateSelect}
              className="pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SessionCalendarButton;
