
import { supabase } from "@/integrations/supabase/client";
import { TrainerInvitation } from "@/components/client/types";

export const fetchPendingInvitationsByEmail = async (email: string): Promise<TrainerInvitation[]> => {
  console.log("Fetching invitations for email:", email);
  
  // First, get the invitations data
  const { data: invitationsData, error: invitationsError } = await supabase
    .from("client_invitations")
    .select("id, email, trainer_id, created_at, status")
    .eq("email", email)
    .eq("status", "pending");
  
  console.log("Raw query result:", invitationsData, "Error:", invitationsError);

  if (invitationsError) {
    console.error("Error fetching invitations:", invitationsError);
    throw invitationsError;
  }

  // If we have invitations, fetch the trainer names separately
  if (invitationsData && invitationsData.length > 0) {
    const formattedInvitations: TrainerInvitation[] = [];
    
    // Get all trainer IDs
    const trainerIds = invitationsData.map(inv => inv.trainer_id);
    
    console.log("Found trainer IDs:", trainerIds);
    
    // Fetch trainer profiles in a single query
    const { data: trainerProfiles, error: trainersError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", trainerIds);
      
    if (trainersError) {
      console.error("Error fetching trainer profiles:", trainersError);
      throw trainersError;
    }
    
    console.log("Trainer profiles found:", trainerProfiles);
    
    // Map trainer names to invitations
    for (const invitation of invitationsData) {
      const trainer = trainerProfiles?.find(t => t.id === invitation.trainer_id);
      formattedInvitations.push({
        id: invitation.id,
        email: invitation.email,
        trainer_id: invitation.trainer_id,
        trainer_name: trainer?.name || "Entrenador",
        created_at: invitation.created_at,
        status: invitation.status as 'pending' | 'accepted' | 'rejected'
      });
    }
    
    console.log("Formatted invitations:", formattedInvitations);
    return formattedInvitations;
  } 
  
  console.log("No invitations found for email:", email);
  return [];
};

export const acceptInvitation = async (invitationId: string, trainerId: string, userId: string, userEmail: string): Promise<void> => {
  console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
  
  // Update the status to 'accepted' instead of the 'accepted' boolean
  const { error: updateError } = await supabase
    .from("client_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  if (updateError) throw updateError;

  const { data: existingClient, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("email", userEmail.toLowerCase())
    .maybeSingle();

  if (clientError && clientError.code !== 'PGRST116') throw clientError;

  if (existingClient) {
    // Add relationship in the new client_trainer_relationships table
    await supabase
      .from("client_trainer_relationships")
      .insert({
        client_id: existingClient.id,
        trainer_id: trainerId,
        is_primary: !existingClient.trainer_id
      })
      .select();
    
    // If no primary trainer yet, also update the client record
    if (!existingClient.trainer_id) {
      await supabase
        .from("clients")
        .update({ trainer_id: trainerId })
        .eq("id", existingClient.id);
    }
  } else {
    // Create new client record
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        email: userEmail.toLowerCase(),
        name: userId ? userId.split('@')[0] : userEmail.split('@')[0],
        trainer_id: trainerId,
        trainers: [trainerId],
        user_id: userId
      })
      .select();
      
    if (insertError) throw insertError;
      
    // Also add relationship to the junction table
    if (newClient && newClient.length > 0) {
      await supabase
        .from("client_trainer_relationships")
        .insert({
          client_id: newClient[0].id,
          trainer_id: trainerId,
          is_primary: true
        });
    }
  }
};

export const rejectInvitation = async (invitationId: string): Promise<void> => {
  console.log("Rejecting invitation:", invitationId);
  
  // Update the status to 'rejected' instead of deleting
  const { error } = await supabase
    .from("client_invitations")
    .update({ status: "rejected" })
    .eq("id", invitationId);

  if (error) throw error;
};
