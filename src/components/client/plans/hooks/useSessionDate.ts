
import { useState, useCallback, useEffect } from "react";
import { updateSessionDate } from "../services/sessionDateService";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Import the result type from the service
type SessionDateServiceResult = {
  success: boolean;
  data?: any;
  error?: any;
  warning?: string;
};

export const useSessionDate = (
  sessionId: string,
  initialDate?: string | null,
  onDateUpdated?: (newDate: string | null) => void
) => {
  const [date, setDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { clientId } = useClientIdentification();

  // Ensure date is updated if initialDate changes
  useEffect(() => {
    if (initialDate) {
      setDate(new Date(initialDate));
    } else {
      setDate(undefined);
    }
  }, [initialDate]);

  const handleSelect = useCallback((newDate: Date | undefined) => {
    setDate(newDate);
  }, []);

  const handleSave = useCallback(async () => {
    if (!clientId) return;
    
    setIsUpdating(true);
    
    try {
      const result: SessionDateServiceResult = await updateSessionDate(sessionId, clientId, date || null);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error?.message || "No se pudo actualizar la fecha",
          variant: "destructive",
        });
        return;
      }

      if (result.warning) {
        toast({
          title: "Advertencia",
          description: result.warning,
        });
      } else {
        // Mostrar mensaje de éxito solo si hubo un cambio real
        if (initialDate !== (date?.toISOString() || null)) {
          toast({
            title: "Fecha actualizada",
            description: "La fecha de la sesión ha sido guardada correctamente",
          });
        }
      }
      
      setIsOpen(false);
      
      if (onDateUpdated) {
        console.log("6. Llamando a onDateUpdated con:", date?.toISOString() || null);
        onDateUpdated(date?.toISOString() || null);
      }
    } finally {
      setIsUpdating(false);
    }
  }, [sessionId, clientId, date, initialDate, toast, onDateUpdated]);

  const handleClear = useCallback(() => {
    setDate(undefined);
  }, []);

  const formatDisplayDate = useCallback((dateStr?: string | null) => {
    if (!dateStr) return "Sin fecha asignada";
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", {
        locale: es,
      });
    } catch (e) {
      return "Fecha inválida";
    }
  }, []);

  return {
    date,
    isOpen,
    isUpdating,
    setIsOpen,
    handleSelect,
    handleSave,
    handleClear,
    formatDisplayDate,
    disabled: !clientId
  };
};
