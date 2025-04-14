
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";

export type ScheduledSession = {
  id: string;
  name: string;
  scheduledDate: string;
  planName: string;
  planId: string;
};

export const useScheduledSessions = () => {
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { clientId } = useClientIdentification();

  useEffect(() => {
    const fetchScheduledSessions = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(`
            id, 
            name, 
            scheduled_date,
            plans:plan_id (
              id,
              name
            )
          `)
          .eq("client_id", clientId)
          .not("scheduled_date", "is", null);

        if (error) {
          console.error("Error fetching scheduled sessions:", error);
          return;
        }

        // Transformar los datos a nuestro formato
        const formattedSessions: ScheduledSession[] = data.map(session => ({
          id: session.id,
          name: session.name,
          scheduledDate: session.scheduled_date,
          planName: session.plans.name,
          planId: session.plans.id
        }));

        setSessions(formattedSessions);
      } catch (error) {
        console.error("Error en fetchScheduledSessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledSessions();
  }, [clientId]);

  return {
    sessions,
    loading,
    hasScheduledSessions: sessions.length > 0
  };
};
