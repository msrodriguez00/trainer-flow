
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

    console.log("Checking RLS policies for sessions table");

    // Use SQL to check if RLS is enabled (using direct SQL query)
    const { data: rlsEnabled, error: rlsError } = await supabaseAdmin.rpc(
      'is_rls_enabled',
      { table_name: 'sessions' }
    );
    
    if (rlsError) {
      console.error("Error checking RLS status:", rlsError);
      throw new Error(`Could not verify RLS status: ${rlsError.message}`);
    }

    // Get all policies for the sessions table
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc(
      'get_policies_for_table',
      { table_name: 'sessions' }
    );
    
    if (policiesError) {
      console.error("Error getting policies:", policiesError);
      throw new Error(`Could not get policies: ${policiesError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "RLS policies checked",
        rls_enabled: rlsEnabled,
        policies: policies
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking RLS policies:", error);
    
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
