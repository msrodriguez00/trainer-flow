
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

    // Obtener información sobre las políticas RLS para la tabla sessions
    const { data: policiesData, error: policiesError } = await supabaseAdmin
      .rpc("get_policies_for_table", { table_name: "sessions" });

    if (policiesError) {
      throw policiesError;
    }

    // Verificar si RLS está habilitado
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .rpc("is_rls_enabled", { table_name: "sessions" });

    if (rlsError) {
      throw rlsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "RLS policies checked",
        rls_enabled: rlsData,
        policies: policiesData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

export {};
