
import { useState } from "react";
import { Calendar as CalendarIcon, ChevronRight, PlayCircle } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useScheduledSessions, ScheduledSession } from "@/hooks/client/useScheduledSessions";
import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ActivityCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

const ActivityCalendar = ({ 
  selectedDate, 
  onSelectDate, 
  className = "" 
}: ActivityCalendarProps) => {
  const { sessions, loading } = useScheduledSessions();
  const navigate = useNavigate();
  
  const formatDateDisplay = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  // Helper para determinar si hay sesiones en una fecha específica
  const hasSessionOnDate = (date: Date) => {
    return sessions.some(session => 
      isSameDay(new Date(session.scheduledDate), date)
    );
  };

  // Obtener las sesiones para la fecha seleccionada
  const sessionsForSelectedDate = sessions.filter(session => 
    isSameDay(new Date(session.scheduledDate), selectedDate)
  );

  // Función para ir a los detalles del plan
  const goToPlanDetails = (planId: string) => {
    navigate(`/client-plan/${planId}`);
  };

  // Nueva función para iniciar una sesión
  const startSession = (sessionId: string) => {
    navigate(`/client-session/${sessionId}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          Calendario de Actividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onSelectDate(date)}
            className="rounded-md border"
            modifiers={{
              hasSession: (date) => hasSessionOnDate(date),
            }}
            modifiersClassNames={{
              hasSession: "bg-primary/20 text-primary font-bold",
            }}
          />
        </div>
        
        {selectedDate && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">
              {formatDateDisplay(selectedDate)}
            </h3>
            
            {loading ? (
              <p className="text-sm text-gray-500">Cargando actividades...</p>
            ) : sessionsForSelectedDate.length > 0 ? (
              <div className="space-y-3">
                {sessionsForSelectedDate.map((session) => (
                  <div key={session.id} className="bg-secondary/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{session.name}</h4>
                        <p className="text-sm text-gray-600">Plan: {session.planName}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => goToPlanDetails(session.planId)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => startSession(session.id)}
                          className="flex items-center gap-1"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Iniciar
                        </Button>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {format(new Date(session.scheduledDate), "HH:mm", { locale: es })}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No hay actividades programadas para este día.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityCalendar;
