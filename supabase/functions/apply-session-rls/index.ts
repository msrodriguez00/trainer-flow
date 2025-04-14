
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create client with service role for admin access
    const supabaseAdmin = createClient(url, serviceRole, {
      auth: { persistSession: false }
    });

    console.log("Applying RLS policies for sessions table");

    // Get request body
    const requestData = await req.json().catch(() => ({}));
    const forceApply = requestData?.forceApply === true;

    // Apply the RLS policies directly using SQL
    const { data, error } = await supabaseAdmin.rpc('apply_session_rls_policies');

    if (error) {
      console.error("Error applying RLS policies:", error);
      
      if (forceApply) {
        // If the RPC method fails but forceApply is true, try direct SQL
        const { error: sqlError } = await supabaseAdmin.from('sessions').select('id').limit(1);
        
        if (sqlError) {
          console.error("Error confirming session table access:", sqlError);
          throw new Error(`Could not confirm access to sessions table: ${sqlError.message}`);
        }
        
        // Apply RLS directly using SQL
        const { error: rpcError } = await supabaseAdmin.rpc('apply_session_rls_policies');

        // Check if the call worked this time
        if (rpcError) {
          console.error("Error applying session RLS policies (2nd attempt):", rpcError);
          throw new Error(`Failed to apply RLS policies: ${rpcError.message}`);
        }
      } else {
        throw error;
      }
    }

    // Verify that RLS is enabled on the sessions table
    const { data: rlsCheck, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'sessions')
      .single();
    
    if (rlsError) {
      console.error("Error checking RLS status:", rlsError);
      throw new Error(`Could not verify RLS status: ${rlsError.message}`);
    }

    // Get all policies for the sessions table
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'sessions');
    
    if (policiesError) {
      console.error("Error getting policies:", policiesError);
      throw new Error(`Could not get policies: ${policiesError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "RLS policies applied successfully",
        rls_enabled: rlsCheck?.rowsecurity,
        policies: policies
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error applying session RLS policies:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        error: String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

export {};
