
import { supabase } from "@/integrations/supabase/client";
import { TrainerInvitation } from "@/components/client/types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export const fetchPendingInvitationsByEmail = async (email: string): Promise<TrainerInvitation[]> => {
  console.log("=== DETAILED INVITATIONS DEBUG ===");
  console.log("Input email:", email);
  
  // Ensure the email is normalized to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  console.log("Normalized email for query:", normalizedEmail);
  
  // Get auth token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;
  
  try {
    console.log("USING DIRECT REST API CALL");
    console.log("Endpoint: GET /rest/v1/client_invitations");
    console.log("Querying for email:", normalizedEmail);
    
    // Make direct REST API call
    const response = await fetch(`${SUPABASE_URL}/rest/v1/client_invitations?email=eq.${encodeURIComponent(normalizedEmail)}&status=eq.pending&select=id,email,trainer_id,created_at,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    console.log("REST API Status Code:", response.status);
    
    // Check if response is ok (status code 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("REST API Error:", errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    // Parse response body
    const invitationsData = await response.json();
    console.log("REST API Response:", invitationsData);
    
    // If we have invitations, obtain the names of the trainers
    if (invitationsData && invitationsData.length > 0) {
      const formattedInvitations: TrainerInvitation[] = [];
      
      // Get all trainer IDs
      const trainerIds = invitationsData.map(inv => inv.trainer_id);
      console.log("Found trainer IDs:", trainerIds);
      
      // Get trainer profiles using REST API
      const trainersResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${trainerIds.join(',')})&select=id,name`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const trainerProfiles = await trainersResponse.json();
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
  
  // Get auth token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;
  
  // Normalize email
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  try {
    // Update the status to 'accepted' using REST API
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/client_invitations?id=eq.${invitationId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: "accepted" })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Error updating invitation: ${errorText}`);
    }
    
    // Check if client already exists
    const clientResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients?email=eq.${encodeURIComponent(normalizedEmail)}&select=*`, {
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const existingClients = await clientResponse.json();
    const existingClient = existingClients.length > 0 ? existingClients[0] : null;
    
    if (existingClient) {
      // Add relationship in the client_trainer_relationships table
      await fetch(`${SUPABASE_URL}/rest/v1/client_trainer_relationships`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          client_id: existingClient.id,
          trainer_id: trainerId,
          is_primary: !existingClient.trainer_id
        })
      });
      
      // If no primary trainer yet, update the client record
      if (!existingClient.trainer_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${existingClient.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ trainer_id: trainerId })
        });
      }
    } else {
      // Create new client record
      const clientName = userId ? userId.split('@')[0] : normalizedEmail.split('@')[0];
      
      const newClientResponse = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: clientName,
          trainer_id: trainerId,
          trainers: [trainerId],
          user_id: userId
        })
      });
      
      if (!newClientResponse.ok) {
        const errorText = await newClientResponse.text();
        throw new Error(`Error creating client: ${errorText}`);
      }
      
      const newClient = await newClientResponse.json();
      
      // Also add relationship to the junction table
      if (newClient && newClient.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/client_trainer_relationships`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            client_id: newClient[0].id,
            trainer_id: trainerId,
            is_primary: true
          })
        });
      }
    }
  } catch (error) {
    console.error("Error in acceptInvitation:", error);
    throw error;
  }
};

export const rejectInvitation = async (invitationId: string): Promise<void> => {
  console.log("Rejecting invitation:", invitationId);
  
  // Get auth token for authenticated requests
  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;
  
  // Update the status to 'rejected' using REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/client_invitations?id=eq.${invitationId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ status: "rejected" })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error rejecting invitation: ${errorText}`);
  }
};
