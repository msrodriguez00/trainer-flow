
import { useState } from "react";
import { Session } from "./types";
import { createInitialSeries } from "./sessionUtils";
import { useToast } from "@/hooks/use-toast";

export const useSessionOperations = (initialSessions: Session[]) => {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const { toast } = useToast();

  const addSession = () => {
    setSessions([
      ...sessions,
      {
        id: `temp-session-${Date.now()}`,
        name: `Sesión ${sessions.length + 1}`,
        series: [
          {
            id: `temp-series-${Date.now()}`,
            name: "Serie 1",
            exercises: []
          }
        ]
      }
    ]);
  };

  const removeSession = (index: number) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Error",
        description: "El plan debe tener al menos una sesión.",
        variant: "destructive",
      });
    }
  };

  const updateSessionName = (index: number, name: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[index].name = name;
    setSessions(updatedSessions);
  };

  const addSeries = (sessionIndex: number) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series.push({
      id: `temp-series-${Date.now()}`,
      name: `Serie ${updatedSessions[sessionIndex].series.length + 1}`,
      exercises: []
    });
    setSessions(updatedSessions);
  };

  const removeSeries = (sessionIndex: number, seriesIndex: number) => {
    const updatedSessions = [...sessions];
    if (updatedSessions[sessionIndex].series.length > 1) {
      updatedSessions[sessionIndex].series = updatedSessions[sessionIndex].series.filter(
        (_, i) => i !== seriesIndex
      );
      setSessions(updatedSessions);
    } else {
      toast({
        title: "Error",
        description: "Cada sesión debe tener al menos una serie.",
        variant: "destructive",
      });
    }
  };

  const updateSeriesName = (sessionIndex: number, seriesIndex: number, name: string) => {
    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex].series[seriesIndex].name = name;
    setSessions(updatedSessions);
  };

  return {
    sessions,
    setSessions,
    addSession,
    removeSession,
    updateSessionName,
    addSeries,
    removeSeries,
    updateSeriesName
  };
};
