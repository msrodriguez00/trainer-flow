import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { useSessionDate } from "./hooks/useSessionDate";
import DatePickerTrigger from "./components/DatePickerTrigger";
import DatePickerFooter from "./components/DatePickerFooter";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface SessionDatePickerProps {
  sessionId: string;
  initialDate?: string | null;
  disabled?: boolean;
  onDateUpdated?: (newDate: string | null) => void;
}

export const SessionDatePicker = ({ 
  sessionId, 
  initialDate, 
  disabled = false,
  onDateUpdated 
}: SessionDatePickerProps) => {
  const {
    date,
    isOpen,
    isUpdating,
    setIsOpen,
    handleSelect,
    handleSave,
    handleClear,
    formatDisplayDate,
    disabled: hookDisabled
  } = useSessionDate(sessionId, initialDate, onDateUpdated);

  const [showCalendar, setShowCalendar] = useState(false);
  
  const finalDisabled = disabled || hookDisabled;
  const displayDate = date ? formatDisplayDate(date.toISOString()) : "Agendar fecha";

  console.log("SessionDatePicker render:", { 
    sessionId, 
    initialDate, 
    hookDisabled, 
    finalDisabled, 
    date: date?.toISOString(),
    isOpen,
    showCalendar
  });
  
  // Sincronizar showCalendar con isOpen
  useEffect(() => {
    setShowCalendar(isOpen);
  }, [isOpen]);

  // Sincronizar isOpen con showCalendar
  useEffect(() => {
    if (!finalDisabled) {
      setIsOpen(showCalendar);
    }
  }, [showCalendar, setIsOpen, finalDisabled]);
  
  const handleButtonClick = () => {
    console.log("Botón de fecha clickeado, mostrando calendario");
    setShowCalendar(true);
  };

  // Agregar un manejador para cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCalendar && !target.closest('.date-picker-content')) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, setShowCalendar]);
  
  return (
    <div className="relative">
      <DatePickerTrigger 
        displayText={displayDate}
        hasDate={!!date}
        disabled={finalDisabled}
        onClick={handleButtonClick}
      />
      
      {showCalendar && (
        <>
          {/* Overlay personalizado */}
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setShowCalendar(false)}
          />
          <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-auto p-0 bg-white rounded-md shadow-lg date-picker-content max-h-[90vh] overflow-auto">
            <div className="p-3">
              <div className="text-center font-medium mb-2 text-gray-700">
                Selecciona una fecha para la sesión
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  console.log("Fecha seleccionada en calendario:", newDate);
                  handleSelect(newDate);
                }}
                className="rounded-md border pointer-events-auto"
                locale={es}
              />
            </div>
            <DatePickerFooter
              onClear={() => {
                console.log("Botón Limpiar presionado");
                handleClear();
                setShowCalendar(false);
              }}
              onCancel={() => {
                console.log("Botón Cancelar presionado");
                setShowCalendar(false);
              }}
              onSave={() => {
                console.log("Botón Guardar presionado");
                handleSave();
                setShowCalendar(false);
              }}
              isUpdating={isUpdating}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default SessionDatePicker;
