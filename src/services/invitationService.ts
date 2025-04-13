
import { supabase } from "@/integrations/supabase/client";
import { TrainerInvitation } from "@/components/client/types";

export const fetchPendingInvitationsByEmail = async (email: string): Promise<TrainerInvitation[]> => {
  console.log("=== DETAILED INVITATIONS DEBUG ===");
  console.log("Input email:", email);
  
  // Ensure the email is normalized to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  console.log("Normalized email for query:", normalizedEmail);
  
  // Log relevant request information
  console.log("Fetching invitations for email:", normalizedEmail);
  console.log("QUERY START: Fetching invitations from client_invitations table");
  
  try {
    // The RLS policy will filter based on the authenticated user's email
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("client_invitations")
      .select("id, email, trainer_id, created_at, status")
      .eq("status", "pending");
    
    console.log("QUERY END: Response received from database");
    console.log("Raw query result:", invitationsData);
    console.log("Error:", invitationsError);

    // Verify the response is not null
    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      throw invitationsError;
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
  
  try {
    // Start a Supabase transaction with .rpc() for better error handling
    const { error: rpcError } = await supabase.functions.invoke('accept-invitation', {
      body: { 
        invitationId,
        trainerId,
        userId,
        email: normalizedEmail 
      }
    });

    if (rpcError) {
      console.error("RPC error accepting invitation:", rpcError);
      throw rpcError;
    }
  } catch (error) {
    console.error("Error in acceptInvitation:", error);
    throw error;
  }
};

export const rejectInvitation = async (invitationId: string): Promise<void> => {
  console.log("Rejecting invitation:", invitationId);
  
  // Update the status to 'rejected' - RLS policy will ensure user can only update their own invitations
  const { error } = await supabase
    .from("client_invitations")
    .update({ status: "rejected" })
    .eq("id", invitationId);

  if (error) throw error;
};
