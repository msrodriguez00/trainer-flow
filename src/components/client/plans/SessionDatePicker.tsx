
import { useState, useCallback, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [date, setDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Asegurar que la fecha inicial se establezca correctamente
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

  const handleSave = async () => {
    if (disabled) return;
    
    try {
      setIsUpdating(true);
      
      // Incluir logs de diagnóstico detallados
      console.log("Intentando actualizar fecha de sesión:", {
        sessionId,
        newDate: date?.toISOString() || null,
        authSession: await supabase.auth.getSession()
      });

      // Eliminar la referencia a updated_at que no existe en la tabla
      const { data, error } = await supabase
        .from("sessions")
        .update({ 
          scheduled_date: date?.toISOString() || null
        })
        .eq("id", sessionId)
        .select();

      console.log("Resultado de la actualización:", { data, error });

      if (error) {
        console.error("Error al actualizar la fecha de la sesión:", error);
        
        // Comprobar si es un problema de permisos
        if (error.code === "42501" || error.message.includes("permission") || error.message.includes("policy")) {
          console.error("Error de permisos. Verificando políticas RLS...");
          
          // Intentar obtener información de la sesión para depurar
          const { data: sessionData, error: sessionError } = await supabase
            .from("sessions")
            .select("*, plans(client_id)")
            .eq("id", sessionId)
            .single();
            
          console.log("Datos de sesión para depuración:", { sessionData, sessionError });
        }
        
        toast({
          title: "Error",
          description: `No se pudo actualizar la fecha de la sesión: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Verificar que la actualización fue exitosa
      if (data && data.length > 0) {
        console.log("Fecha actualizada exitosamente:", data[0]);
        toast({
          title: "Fecha actualizada",
          description: "La fecha de la sesión ha sido guardada correctamente",
        });
      } else {
        console.warn("La actualización no retornó datos, verificando resultado...");
        // Verificar que la actualización se aplicó correctamente
        const { data: verifyData, error: verifyError } = await supabase
          .from("sessions")
          .select("scheduled_date")
          .eq("id", sessionId)
          .single();
          
        console.log("Verificación de actualización:", { 
          verifyData, 
          verifyError,
          expectedDate: date?.toISOString() || null
        });
        
        if (verifyError || (verifyData?.scheduled_date !== (date?.toISOString() || null))) {
          toast({
            title: "Advertencia",
            description: "La fecha podría no haberse actualizado correctamente",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Fecha actualizada",
            description: "La fecha de la sesión ha sido guardada",
          });
        }
      }
      
      setIsOpen(false);
      if (onDateUpdated) {
        onDateUpdated(date?.toISOString() || null);
      }
    } catch (error) {
      console.error("Error al actualizar la fecha de la sesión:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar la fecha",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClear = () => {
    setDate(undefined);
  };

  const formatDisplayDate = (dateStr?: string | null) => {
    if (!dateStr) return "Sin fecha asignada";
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", {
        locale: es,
      });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <div>
      <Popover open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDisplayDate(date.toISOString()) : "Agendar fecha"}
          </Button>
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
          <div className="flex justify-between items-center p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isUpdating}
            >
              <X className="mr-1 h-4 w-4" /> Limpiar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isUpdating}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
              >
                <Check className="mr-1 h-4 w-4" /> {isUpdating ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SessionDatePicker;
