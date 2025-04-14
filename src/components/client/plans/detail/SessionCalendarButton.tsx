
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    scheduledDate ? new Date(scheduledDate) : undefined
  );

  // Update selected date when scheduledDate prop changes
  React.useEffect(() => {
    if (scheduledDate) {
      setSelectedDate(new Date(scheduledDate));
    }
  }, [scheduledDate]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      try {
        console.log(`SessionCalendarButton - Intentando programar sesión ${sessionId} para la fecha:`, date);
        setSelectedDate(date);
        setIsUpdating(true);
        
        // Make sure we're using a consistent date format
        const adjustedDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds()
        ));
        
        await onScheduleSession(sessionId, adjustedDate);
        
        console.log(`SessionCalendarButton - Sesión ${sessionId} programada exitosamente para:`, date);
        setIsOpen(false);
        toast({
          title: "Fecha programada",
          description: `Sesión programada para ${format(date, "d MMM yyyy", { locale: es })}`,
        });
      } catch (error) {
        console.error("Error en SessionCalendarButton - No se pudo programar la sesión:", error);
        toast({
          title: "Error",
          description: "No se pudo programar la sesión. Por favor intenta de nuevo.",
          variant: "destructive",
        });
        // Reset to previous date if we have one
        if (scheduledDate) {
          setSelectedDate(new Date(scheduledDate));
        }
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Format date for display with proper timezone handling
  const formattedDate = React.useMemo(() => {
    if (!scheduledDate) return null;
    try {
      return format(new Date(scheduledDate), "d MMM yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha inválida";
    }
  }, [scheduledDate]);

  return (
    <div className="mt-2 md:mt-0 flex items-center">
      {formattedDate ? (
        <Badge variant="outline" className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          <span>{formattedDate}</span>
        </Badge>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center">
          <CalendarClock className="h-3 w-3 mr-1" />
          <span>Sin fecha programada</span>
        </div>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>Guardando...</>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-1" />
                {scheduledDate ? "Cambiar fecha" : "Programar"}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-1">
            <h5 className="text-sm font-medium mb-2">Selecciona una fecha</h5>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="pointer-events-auto"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SessionCalendarButton;
