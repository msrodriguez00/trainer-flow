
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerTriggerProps {
  displayText: string;
  hasDate: boolean;
  disabled?: boolean;
}

export const DatePickerTrigger = React.forwardRef<
  HTMLButtonElement,
  DatePickerTriggerProps
>(({ displayText, hasDate, disabled = false }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !hasDate && "text-muted-foreground"
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {displayText}
    </Button>
  );
});

DatePickerTrigger.displayName = "DatePickerTrigger";

export default DatePickerTrigger;
