
import { useState } from "react";
import { Plus, Trash, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SeriesCard } from "./SeriesCard";
import { Exercise } from "@/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SessionAccordionProps {
  sessions: {
    id: string;
    name: string;
    series: {
      id: string;
      name: string;
      exercises: {
        exerciseId: string;
        level: number;
        sessionId: string;
        seriesId: string;
      }[];
    }[];
  }[];
  exercises: Exercise[];
  onSessionNameChange: (sessionIndex: number, name: string) => void;
  onRemoveSession: (sessionIndex: number) => void;
  onAddSeries: (sessionIndex: number) => void;
  onRemoveSeries: (sessionIndex: number, seriesIndex: number) => void;
  onSeriesNameChange: (sessionIndex: number, seriesIndex: number, name: string) => void;
  onAddExercise: (sessionIndex: number, seriesIndex: number) => void;
  onExerciseChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, exerciseId: string) => void;
  onLevelChange: (sessionIndex: number, seriesIndex: number, exerciseIndex: number, level: number) => void;
  onRemoveExercise: (sessionIndex: number, seriesIndex: number, exerciseIndex: number) => void;
  onAddSession: () => void;
}

export const SessionAccordion = ({
  sessions,
  exercises,
  onSessionNameChange,
  onRemoveSession,
  onAddSeries,
  onRemoveSeries,
  onSeriesNameChange,
  onAddExercise,
  onExerciseChange,
  onLevelChange,
  onRemoveExercise,
  onAddSession
}: SessionAccordionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Sesiones y Ejercicios</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddSession}
        >
          <Plus className="h-4 w-4 mr-1" />
          Añadir sesión
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['session-0']} className="space-y-4">
        {sessions.map((session, sessionIndex) => (
          <AccordionItem 
            key={session.id} 
            value={`session-${sessionIndex}`}
            className="border rounded-md overflow-hidden"
          >
            <div className="flex items-center p-2 bg-gray-50">
              <AccordionTrigger className="flex-1">
                <div className="flex items-center">
                  <FolderKanban className="h-5 w-5 mr-2" />
                  {session.name}
                </div>
              </AccordionTrigger>
              <div className="flex gap-2 mr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSession(sessionIndex);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            <AccordionContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`session-name-${sessionIndex}`}>Nombre de la sesión</Label>
                  <Input
                    id={`session-name-${sessionIndex}`}
                    value={session.name}
                    onChange={(e) => onSessionNameChange(sessionIndex, e.target.value)}
                    placeholder="Nombre de la sesión"
                    required
                  />
                </div>

                <div className="flex justify-between items-center mt-4 mb-2">
                  <h3 className="text-base font-medium">Series</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAddSeries(sessionIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir serie
                  </Button>
                </div>

                <div className="space-y-4">
                  {session.series.map((series, seriesIndex) => (
                    <SeriesCard
                      key={series.id}
                      sessionIndex={sessionIndex}
                      seriesIndex={seriesIndex}
                      series={series}
                      exercises={exercises}
                      onSeriesNameChange={onSeriesNameChange}
                      onRemoveSeries={onRemoveSeries}
                      onAddExercise={onAddExercise}
                      onExerciseChange={onExerciseChange}
                      onLevelChange={onLevelChange}
                      onRemoveExercise={onRemoveExercise}
                    />
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
