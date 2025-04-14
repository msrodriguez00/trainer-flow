
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface DatePickerFooterProps {
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
  isUpdating: boolean;
}

export const DatePickerFooter = ({
  onClear,
  onCancel,
  onSave,
  isUpdating
}: DatePickerFooterProps) => {
  return (
    <div className="flex justify-between items-center p-2 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={isUpdating}
      >
        <X className="mr-1 h-4 w-4" /> Limpiar
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancelar
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isUpdating}
        >
          <Check className="mr-1 h-4 w-4" /> {isUpdating ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
};

export default DatePickerFooter;
