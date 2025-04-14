
import { supabase } from "@/integrations/supabase/client";
import { Trainer } from "@/components/client/dashboard/types";
import { createDefaultTrainer } from "./trainerThemeUtils";

export async function fetchClientTrainerData(userEmail: string | null | undefined): Promise<{
  clientData: any | null;
  trainerIds: string[];
  currentTrainerId: string | null;
  error?: Error;
}> {
  try {
    if (!userEmail) {
      throw new Error("No user email available");
    }
    
    console.log("Loading trainers for user email:", userEmail);
    
    // Check if the client exists and has trainers assigned
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select(`
        id,
        email,
        name,
        current_trainer_id,
        trainer_id,
        trainers
      `)
      .eq("email", userEmail.toLowerCase())
      .maybeSingle();
    
    if (clientError && clientError.code !== 'PGRST116') {
      console.error("Error fetching client data:", clientError);
      throw clientError;
    }
    
    if (!clientData) {
      console.log("No client data found for email:", userEmail);
      return { clientData: null, trainerIds: [], currentTrainerId: null };
    }
    
    console.log("Client data loaded:", clientData);
    
    // Check if client has a current trainer set
    const currentTrainerId = clientData.current_trainer_id || null;
    
    // Get trainer IDs from client data
    let trainerIds: string[] = [];
    
    if (clientData.trainers && clientData.trainers.length > 0) {
      trainerIds = clientData.trainers;
    } else if (clientData.trainer_id) {
      trainerIds = [clientData.trainer_id];
    }
    
    return { clientData, trainerIds, currentTrainerId };
  } catch (error: any) {
    console.error("Error in fetchClientTrainerData:", error);
    return { clientData: null, trainerIds: [], currentTrainerId: null, error };
  }
}

export async function fetchTrainersWithBranding(trainerIds: string[]): Promise<{
  trainers: Trainer[];
  error?: Error;
}> {
  try {
    if (trainerIds.length === 0) {
      return { trainers: [] };
    }
    
    // Check access to trainer profiles - using public.profiles
    const { data: trainersData, error: trainersError } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("id", trainerIds)
      .eq("role", "trainer");
    
    if (trainersError) {
      console.error("Error fetching trainers data:", trainersError);
      throw trainersError;
    }
    
    console.log("Trainer profiles loaded:", trainersData);
    
    if (!trainersData || trainersData.length === 0) {
      console.log("No trainer profiles found for IDs:", trainerIds);
      return { trainers: [] };
    }
    
    const trainersWithBranding: Trainer[] = [];
    
    for (const trainer of trainersData) {
      console.log("Fetching branding for trainer:", trainer.id);
      
      // Using service role or fetch with different approach if needed
      const { data: brandData, error: brandError } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", trainer.id)
        .maybeSingle();
      
      if (brandError) {
        console.warn("Error fetching branding for trainer:", trainer.id, brandError);
      }
      
      console.log("Branding data for trainer:", trainer.id, brandData);
      
      trainersWithBranding.push({
        id: trainer.id,
        name: trainer.name || "Entrenador sin nombre",
        branding: brandData ? {
          logo_url: brandData.logo_url,
          primary_color: brandData.primary_color || "#9b87f5",
          secondary_color: brandData.secondary_color || "#E5DEFF",
          accent_color: brandData.accent_color || "#7E69AB"
        } : {
          logo_url: null,
          primary_color: "#9b87f5",
          secondary_color: "#E5DEFF",
          accent_color: "#7E69AB"
        }
      });
    }
    
    return { trainers: trainersWithBranding };
  } catch (error: any) {
    console.error("Error in fetchTrainersWithBranding:", error);
    return { trainers: [], error };
  }
}
