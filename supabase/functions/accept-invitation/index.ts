
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Parse request body
    const { invitationId, trainerId, userId, email } = await req.json();
    
    if (!invitationId || !trainerId || !userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Processing invitation acceptance:", { invitationId, trainerId, userId, email });
    
    // Update the status to 'accepted'
    const { error: updateError } = await supabaseClient
      .from("client_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (updateError) throw updateError;

    const { data: existingClient, error: clientError } = await supabaseClient
      .from("clients")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (clientError && clientError.code !== 'PGRST116') throw clientError;

    if (existingClient) {
      // Add relationship in the client_trainer_relationships table
      await supabaseClient
        .from("client_trainer_relationships")
        .insert({
          client_id: existingClient.id,
          trainer_id: trainerId,
          is_primary: !existingClient.trainer_id
        })
        .select();
      
      // If no primary trainer yet, update the client record
      if (!existingClient.trainer_id) {
        await supabaseClient
          .from("clients")
          .update({ trainer_id: trainerId })
          .eq("id", existingClient.id);
      }
    } else {
      // Create new client record
      const { data: newClient, error: insertError } = await supabaseClient
        .from("clients")
        .insert({
          email: email,
          name: email.split('@')[0] || 'Cliente',
          trainer_id: trainerId,
          trainers: [trainerId],
          user_id: userId
        })
        .select();
        
      if (insertError) throw insertError;
        
      // Also add relationship to the junction table
      if (newClient && newClient.length > 0) {
        await supabaseClient
          .from("client_trainer_relationships")
          .insert({
            client_id: newClient[0].id,
            trainer_id: trainerId,
            is_primary: true
          });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in accept-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
