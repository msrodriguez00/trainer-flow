
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plan, Session, Series, PlanExercise } from "@/types";
import { useToast } from "@/hooks/use-toast";

export const usePlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClientId();
    } else {
      // Reset state when user is not authenticated
      setPlans([]);
      setClientId(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (clientId) {
      fetchClientPlans();
    } else if (user && !loading) {
      setLoading(false);
    }
  }, [clientId, user]);

  const fetchClientId = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching client ID for user:", user.id);
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client ID:", error);
        toast({
          title: "Error",
          description: "No se pudo identificar tu perfil de cliente",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Client ID found:", data.id);
        setClientId(data.id);
      } else {
        console.log("No client record found for this user");
        toast({
          title: "Información",
          description: "No se encontró un perfil de cliente asociado a tu cuenta",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in fetchClientId:", error);
      setLoading(false);
    }
  };

  const fetchClientPlans = async () => {
    if (!clientId) return;
    
    setLoading(true);
    console.log("Fetching plans for client ID:", clientId);
    
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

      console.log("Plans data fetched:", plansData?.length || 0, "plans found");

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
              order_index
            `)
            .eq("plan_id", plan.id)
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
              .order("order_index", { ascending: true });
              
            if (seriesError) {
              console.error("Error fetching series for session:", session.id, seriesError);
              continue;
            }
            
            const seriesList: Series[] = [];
            
            for (const serie of (seriesData || [])) {
              // Fetch exercises for this series
              // Make sure to explicitly select the exercise name and all needed fields
              const { data: planExercises, error: exercisesError } = await supabase
                .from("plan_exercises")
                .select(`
                  id,
                  exercise_id,
                  level,
                  exercises:exercise_id (id, name, categories, levels)
                `)
                .eq("series_id", serie.id);
                
              if (exercisesError) {
                console.error("Error fetching exercises for series:", serie.id, exercisesError);
                continue;
              }
              
              console.log("Exercise data for series", serie.id, ":", planExercises);
              
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
      console.error("Error in fetchClientPlans:", error);
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
