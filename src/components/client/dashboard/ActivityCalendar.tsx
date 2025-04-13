
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

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
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("es-ES", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
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
          />
        </div>
        
        {selectedDate && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">
              {formatDateDisplay(selectedDate)}
            </h3>
            <p className="text-sm text-gray-600">
              No hay actividades programadas para este día.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityCalendar;
