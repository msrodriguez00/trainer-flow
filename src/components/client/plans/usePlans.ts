
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plan } from "@/types";
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
    }
  }, [user]);

  useEffect(() => {
    if (clientId) {
      fetchClientPlans();
    } else if (!loading) {
      setLoading(false);
    }
  }, [clientId]);

  const fetchClientId = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client ID:", error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Client ID found:", data.id);
        setClientId(data.id);
      } else {
        console.log("No client record found for this user");
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
    try {
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(`
          id,
          name,
          client_id,
          created_at
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (plansError) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes",
          variant: "destructive",
        });
        console.error("Error fetching plans:", plansError);
        setLoading(false);
        return;
      }

      console.log("Plans data:", plansData);

      if (plansData && plansData.length > 0) {
        const formattedPlans: Plan[] = [];
        
        for (const plan of plansData) {
          const { data: planExercises, error: exercisesError } = await supabase
            .from("plan_exercises")
            .select(`
              id,
              exercise_id,
              level
            `)
            .eq("plan_id", plan.id);
            
          if (exercisesError) {
            console.error("Error fetching exercises for plan:", plan.id, exercisesError);
            continue;
          }
          
          const exercisesWithNames = [];
          
          for (const planExercise of (planExercises || [])) {
            const { data: exerciseData, error: exerciseError } = await supabase
              .from("exercises")
              .select("name")
              .eq("id", planExercise.exercise_id)
              .maybeSingle();
              
            if (exerciseError) {
              console.error("Error fetching exercise:", planExercise.exercise_id, exerciseError);
              continue;
            }
            
            exercisesWithNames.push({
              exerciseId: planExercise.exercise_id,
              exerciseName: exerciseData?.name || "Ejercicio sin nombre",
              level: planExercise.level,
              evaluations: []
            });
          }
          
          formattedPlans.push({
            id: plan.id,
            name: plan.name,
            clientId: plan.client_id,
            createdAt: plan.created_at,
            exercises: exercisesWithNames
          });
        }

        setPlans(formattedPlans);
      } else {
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

  return { plans, loading };
};
