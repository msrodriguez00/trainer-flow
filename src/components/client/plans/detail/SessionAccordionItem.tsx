
import React from "react";
import { Session } from "@/types";
import { 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent
} from "@/components/ui/accordion";
import SeriesDetail from "./SeriesDetail";
import SessionDatePicker from "../SessionDatePicker";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface SessionAccordionItemProps {
  session: Session;
  onDateUpdated: (sessionId: string, newDate: string | null) => void;
}

const SessionAccordionItem: React.FC<SessionAccordionItemProps> = ({ 
  session,
  onDateUpdated
}) => {
  const navigate = useNavigate();
  
  const handleStartSession = () => {
    navigate(`/client-session/${session.id}`);
  };
  
  return (
    <AccordionItem value={session.id} className="border rounded-md mb-4 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:bg-accent/20 [&[data-state=open]]:bg-accent/20">
        <div className="flex items-center justify-between w-full text-left">
          <span className="font-medium">{session.name}</span>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 py-3">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <SessionDatePicker 
              sessionId={session.id} 
              currentDate={session.scheduledDate} 
              onDateUpdated={onDateUpdated}
            />
            
            <Button
              onClick={handleStartSession}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar sesión guiada
            </Button>
          </div>
          
          {session.series.length > 0 ? (
            <div className="space-y-4 mt-4">
              <h4 className="text-sm font-medium">Series</h4>
              {session.series.map((series) => (
                <SeriesDetail key={series.id} series={series} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta sesión no tiene series configuradas
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SessionAccordionItem;
