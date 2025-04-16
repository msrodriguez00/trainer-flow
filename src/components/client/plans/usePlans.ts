
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plan, Session, Series, PlanExercise } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useClientIdentification } from "@/hooks/client/useClientIdentification";

export const usePlans = () => {
  const { toast } = useToast();
  const { clientId, loading: clientLoading } = useClientIdentification();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientPlans();
    } else if (!clientLoading) {
      setLoading(false);
    }
  }, [clientId, clientLoading]);

  const fetchClientPlans = async () => {
    if (!clientId) return;
    
    setLoading(true);
    console.log("Fetching plans for client ID:", clientId);
    
    try {
      // Use the optimized database function to fetch all plans with their full structure in a single query
      const { data, error } = await supabase.rpc('get_client_plans', {
        p_client_id: clientId
      });

      if (error) {
        console.error("Error fetching plans using optimized function:", error);
        // Fall back to the legacy method if the RPC function fails
        return fetchClientPlansLegacy();
      }

      console.log("Plans data fetched using optimized function:", data ? "Data received" : "No data");

      if (data && Array.isArray(data)) {
        // The data is already in the correct format but we need to cast it to ensure TypeScript is satisfied
        setPlans(data as Plan[]);
      } else {
        console.log("No plans found or invalid data format");
        setPlans([]);
      }
    } catch (error) {
      console.error("Error in fetchClientPlans:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los planes",
        variant: "destructive",
      });
      // Try the legacy method as fallback
      return fetchClientPlansLegacy();
    } finally {
      setLoading(false);
    }
  };

  const fetchClientPlansLegacy = async () => {
    console.log("Using legacy method to fetch client plans");
    
    try {
      // First, get all plans assigned to this client
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at,
          month,
          trainer_id
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (plansError) {
        console.error("Error fetching plans:", plansError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Plans data fetched using legacy method:", plansData?.length || 0, "plans found");

      if (plansData && plansData.length > 0) {
        const formattedPlans: Plan[] = [];
        
        for (const plan of plansData) {
          console.log("Processing plan:", plan.id, plan.name);
          
          // Fetch sessions for this plan
          const { data: sessionsData, error: sessionsError } = await supabase
            .from("sessions")
            .select(`
              id,
              name,
              order_index,
              scheduled_date
            `)
            .eq("plan_id", plan.id)
            .eq("client_id", clientId)
            .order("order_index", { ascending: true });
            
          if (sessionsError) {
            console.error("Error fetching sessions for plan:", plan.id, sessionsError);
            continue;
          }
          
          console.log("Sessions fetched for plan:", plan.id, sessionsData?.length || 0, "sessions found");
          
          const sessions: Session[] = [];
          
          for (const session of (sessionsData || [])) {
            // Fetch series for this session
            const { data: seriesData, error: seriesError } = await supabase
              .from("series")
              .select(`
                id,
                name,
                order_index
              `)
              .eq("session_id", session.id)
              .eq("client_id", clientId)
              .order("order_index", { ascending: true });
              
            if (seriesError) {
              console.error("Error fetching series for session:", session.id, seriesError);
              continue;
            }
            
            const seriesList: Series[] = [];
            
            for (const serie of (seriesData || [])) {
              // Fetch exercises for this series, with a JOIN to get the exercise details directly
              const { data: planExercises, error: exercisesError } = await supabase
                .from("plan_exercises")
                .select(`
                  id,
                  exercise_id,
                  level,
                  exercises:exercise_id (*)
                `)
                .eq("series_id", serie.id);
                
              if (exercisesError) {
                console.error("Error fetching exercises for series:", serie.id, exercisesError);
                continue;
              }
              
              console.log("Exercise data for series", serie.id, ":", planExercises);
              
              // Debug each exercise to make sure we have the name
              planExercises?.forEach((ex, idx) => {
                console.log(`Exercise ${idx} data:`, ex);
                console.log(`Exercise ${idx} name:`, ex.exercises?.name || "NO NAME FOUND");
              });
              
              const exercisesWithNames: PlanExercise[] = planExercises?.map(ex => ({
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercises?.name || "Ejercicio sin nombre",
                level: ex.level,
                evaluations: []
              })) || [];
              
              seriesList.push({
                id: serie.id,
                name: serie.name,
                orderIndex: serie.order_index,
                exercises: exercisesWithNames
              });
            }
            
            sessions.push({
              id: session.id,
              name: session.name,
              orderIndex: session.order_index,
              scheduledDate: session.scheduled_date,
              series: seriesList
            });
          }
          
          // Flatten exercises for backward compatibility
          const allExercises: PlanExercise[] = [];
          sessions.forEach(session => {
            session.series.forEach(series => {
              allExercises.push(...series.exercises);
            });
          });
          
          formattedPlans.push({
            id: plan.id,
            name: plan.name,
            clientId: plan.client_id,
            createdAt: plan.created_at,
            month: plan.month,
            sessions: sessions,
            exercises: allExercises
          });
        }

        console.log("Final formatted plans:", formattedPlans.length);
        setPlans(formattedPlans);
      } else {
        console.log("No plans found for this client");
        setPlans([]);
      }
    } catch (error) {
      console.error("Error in fetchClientPlansLegacy:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los planes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { 
    plans, 
    loading, 
    clientId,
    refreshPlans: fetchClientPlans 
  };
};
