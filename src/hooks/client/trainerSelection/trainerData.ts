
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
    
    // Check if the client exists and get its ID
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select(`
        id,
        email,
        name,
        current_trainer_id
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
    
    // Get current trainer from client data
    const currentTrainerId = clientData.current_trainer_id || null;
    
    // Get trainer IDs from the relationships table - this is now our source of truth
    const { data: relationships, error: relationshipsError } = await supabase
      .from("client_trainer_relationships")
      .select("trainer_id, is_primary")
      .eq("client_id", clientData.id);
      
    if (relationshipsError) {
      console.error("Error fetching client-trainer relationships:", relationshipsError);
      throw relationshipsError;
    }
    
    let trainerIds: string[] = [];
    
    if (relationships && relationships.length > 0) {
      // Sort relationships to put primary trainer first
      relationships.sort((a, b) => (a.is_primary ? -1 : 1));
      trainerIds = relationships.map(rel => rel.trainer_id);
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
    
    console.log("Fetching trainers with branding in a single query for IDs:", trainerIds);
    
    // Fetch trainer profiles and branding in a single JOIN query
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        name, 
        role,
        trainer_brands!trainer_id(
          logo_url,
          primary_color,
          secondary_color,
          accent_color
        )
      `)
      .in('id', trainerIds)
      .eq('role', 'trainer');
    
    if (error) {
      console.error("Error fetching trainers with branding:", error);
      throw error;
    }
    
    console.log("Received trainers data with branding:", data?.length || 0, "trainers");
    
    if (!data || data.length === 0) {
      return { trainers: [] };
    }
    
    // Map the joined data to our Trainer format
    const trainersWithBranding: Trainer[] = data.map(trainer => {
      const brandingData = trainer.trainer_brands?.[0] || null;
      
      return {
        id: trainer.id,
        name: trainer.name || "Entrenador sin nombre",
        branding: brandingData ? {
          logo_url: brandingData.logo_url,
          primary_color: brandingData.primary_color || "#9b87f5",
          secondary_color: brandingData.secondary_color || "#E5DEFF",
          accent_color: brandingData.accent_color || "#7E69AB"
        } : {
          logo_url: null,
          primary_color: "#9b87f5",
          secondary_color: "#E5DEFF",
          accent_color: "#7E69AB"
        }
      };
    });
    
    return { trainers: trainersWithBranding };
  } catch (error: any) {
    console.error("Error in fetchTrainersWithBranding:", error);
    return { trainers: [], error };
  }
}
