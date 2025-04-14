
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSessionDate } from "./hooks/useSessionDate";
import DatePickerTrigger from "./components/DatePickerTrigger";
import DatePickerFooter from "./components/DatePickerFooter";

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

  const finalDisabled = disabled || hookDisabled;
  const displayDate = date ? formatDisplayDate(date.toISOString()) : "Agendar fecha";

  return (
    <div>
      <Popover open={isOpen} onOpenChange={finalDisabled ? undefined : setIsOpen}>
        <PopoverTrigger asChild>
          <DatePickerTrigger 
            displayText={displayDate}
            hasDate={!!date}
            disabled={finalDisabled}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              className="rounded-md border pointer-events-auto"
              locale={es}
            />
          </div>
          <DatePickerFooter
            onClear={handleClear}
            onCancel={() => setIsOpen(false)}
            onSave={handleSave}
            isUpdating={isUpdating}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SessionDatePicker;
