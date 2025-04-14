
import React, { useCallback } from "react";
import { Session } from "@/types";
import { ClipboardList } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import SessionAccordionItem from "./SessionAccordionItem";

interface PlanSessionsListProps {
  sessions: Session[];
  onSessionDateUpdate: (sessionId: string, newDate: string | null) => void;
}

export const PlanSessionsList: React.FC<PlanSessionsListProps> = ({ 
  sessions, 
  onSessionDateUpdate 
}) => {
  const handleSessionDateUpdate = useCallback((sessionId: string, newDate: string | null) => {
    onSessionDateUpdate(sessionId, newDate);
  }, [onSessionDateUpdate]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Sesiones de Entrenamiento</h3>
      
      {sessions.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-4">
          {sessions.map((session) => (
            <SessionAccordionItem
              key={session.id}
              session={session}
              onDateUpdated={handleSessionDateUpdate}
            />
          ))}
        </Accordion>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-muted-foreground">Este plan no tiene sesiones configuradas</p>
        </div>
      )}
    </div>
  );
};

export default PlanSessionsList;
