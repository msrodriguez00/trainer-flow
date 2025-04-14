
import React from "react";
import { ClipboardList } from "lucide-react";
import SessionItem from "./SessionItem";

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  level: number;
  evaluations?: any[]; // Made evaluations optional
}

interface Series {
  id: string;
  name: string;
  orderIndex: number;
  exercises: Exercise[];
}

interface Session {
  id: string;
  name: string;
  orderIndex: number;
  scheduledDate?: string;
  series: Series[];
}

interface SessionsListProps {
  sessions: Session[];
  onScheduleSession: (sessionId: string, date: Date) => Promise<void>;
}

const SessionsList: React.FC<SessionsListProps> = ({ sessions, onScheduleSession }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Sesiones de Entrenamiento</h3>
      
      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionItem 
              key={session.id} 
              id={session.id} 
              name={session.name} 
              orderIndex={session.orderIndex} 
              scheduledDate={session.scheduledDate} 
              series={session.series} 
              onScheduleSession={onScheduleSession}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-muted-foreground">Este plan no tiene sesiones configuradas</p>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
