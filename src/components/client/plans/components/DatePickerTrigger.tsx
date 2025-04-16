import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerTriggerProps {
  displayText: string;
  hasDate: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const DatePickerTrigger = React.forwardRef<
  HTMLButtonElement,
  DatePickerTriggerProps
>(({ displayText, hasDate, disabled = false, onClick }, ref) => {
  console.log("DatePickerTrigger rendering:", { displayText, hasDate, disabled });
  
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !hasDate && "text-muted-foreground"
      )}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) {
          console.log("Button click intercepted - button is disabled");
          e.preventDefault();
        } else {
          console.log("Button clicked successfully");
          if (onClick) onClick();
        }
      }}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {displayText}
    </Button>
  );
});

DatePickerTrigger.displayName = "DatePickerTrigger";

export default DatePickerTrigger;
