import { supabase } from "@/integrations/supabase/client";
import { TrainerInvitation } from "@/components/client/types";

export const fetchPendingInvitationsByEmail = async (email: string): Promise<TrainerInvitation[]> => {
  console.log("=== DETAILED INVITATIONS DEBUG ===");
  console.log("Input email:", email);
  
  // Ensure the email is normalized to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  console.log("Normalized email for query:", normalizedEmail);
  
  // Log all request details
  console.log("Request URL:", `${supabase.supabaseUrl}/rest/v1/client_invitations`);
  console.log("Request headers:", {
    "Authorization": "Bearer [REDACTED]",
    "apikey": "[REDACTED]",
    "Content-Type": "application/json"
  });
  console.log("Query parameters:", {
    "email": "eq." + normalizedEmail,
    "status": "eq.pending"
  });
  
  // Get pending invitations with more precise email matching
  console.log("Executing query: SELECT * FROM client_invitations WHERE email = '" + normalizedEmail + "' AND status = 'pending'");
  
  try {
    // First attempt to get data with select and filter methods
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("client_invitations")
      .select("id, email, trainer_id, created_at, status")
      .eq("email", normalizedEmail)
      .eq("status", "pending");
    
    console.log("Raw response from database:", invitationsData);
    console.log("Error from database:", invitationsError);

    // Verify the response is not null
    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      throw invitationsError;
    }

    // Try a direct RPC call as alternative if available data is empty
    if (!invitationsData || invitationsData.length === 0) {
      console.log("No data found with regular query, trying direct SQL query via RPC if available");
      
      // For debugging purposes, also try to count total invitations
      const { data: countData } = await supabase
        .from("client_invitations")
        .select("id", { count: "exact" });
      
      console.log("Total invitations in database:", countData?.length || 0);
      
      // Check if there are any invitations with this email regardless of status
      const { data: anyInvitations } = await supabase
        .from("client_invitations")
        .select("id, email, status")
        .eq("email", normalizedEmail);
      
      console.log("Any invitations for this email:", anyInvitations);
    }

    // If we have invitations, obtain the names of the trainers
    if (invitationsData && invitationsData.length > 0) {
      const formattedInvitations: TrainerInvitation[] = [];
      
      // Get all trainer IDs
      const trainerIds = invitationsData.map(inv => inv.trainer_id);
      console.log("Found trainer IDs:", trainerIds);
      
      // Get trainer profiles in a single query
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
  } catch (err) {
    console.error("Exception in fetchPendingInvitationsByEmail:", err);
    throw err;
  } finally {
    console.log("=== END DETAILED INVITATIONS DEBUG ===");
  }
};

export const acceptInvitation = async (invitationId: string, trainerId: string, userId: string, userEmail: string): Promise<void> => {
  console.log("Accepting invitation:", invitationId, "for trainer:", trainerId);
  
  // Normalize email
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  // Update the status to 'accepted'
  const { error: updateError } = await supabase
    .from("client_invitations")
    .update({ status: "accepted" })
    .eq("id", invitationId);

  if (updateError) throw updateError;

  const { data: existingClient, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (clientError && clientError.code !== 'PGRST116') throw clientError;

  if (existingClient) {
    // Add relationship in the client_trainer_relationships table
    await supabase
      .from("client_trainer_relationships")
      .insert({
        client_id: existingClient.id,
        trainer_id: trainerId,
        is_primary: !existingClient.trainer_id
      })
      .select();
    
    // If no primary trainer yet, update the client record
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
        email: normalizedEmail,
        name: userId ? userId.split('@')[0] : normalizedEmail.split('@')[0],
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
  
  // Update the status to 'rejected'
  const { error } = await supabase
    .from("client_invitations")
    .update({ status: "rejected" })
    .eq("id", invitationId);

  if (error) throw error;
};
