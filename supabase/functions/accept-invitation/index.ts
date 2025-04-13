
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
    
    try {
      // Implementar una transacción lógica - primero verificar si la invitación está pendiente
      const { data: invitationData, error: invitationError } = await supabaseClient
        .from("client_invitations")
        .select("status")
        .eq("id", invitationId)
        .single();
      
      if (invitationError) {
        console.error("Error verificando el estado de la invitación:", invitationError);
        throw invitationError;
      }
      
      if (!invitationData || invitationData.status !== "pending") {
        return new Response(
          JSON.stringify({ error: 'La invitación no está disponible o ya ha sido procesada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verificar si el cliente ya existe
      const { data: existingClient, error: clientError } = await supabaseClient
        .from("clients")
        .select("id, trainer_id, trainers")
        .eq("email", email)
        .maybeSingle();
      
      if (clientError && clientError.code !== 'PGRST116') {
        console.error("Error verificando cliente existente:", clientError);
        throw clientError;
      }
      
      if (existingClient) {
        // Añadir relación en la tabla client_trainer_relationships si no existe
        const { error: relationshipError } = await supabaseClient
          .from("client_trainer_relationships")
          .insert({
            client_id: existingClient.id,
            trainer_id: trainerId,
            is_primary: !existingClient.trainer_id
          })
          .select();
        
        if (relationshipError && relationshipError.code !== '23505') { // Ignorar errores de duplicados
          console.error("Error creando relación cliente-entrenador:", relationshipError);
          throw relationshipError;
        }
        
        // Si no hay entrenador principal, actualizar el registro del cliente
        if (!existingClient.trainer_id) {
          const { error: updateClientError } = await supabaseClient
            .from("clients")
            .update({ trainer_id: trainerId })
            .eq("id", existingClient.id);
          
          if (updateClientError) {
            console.error("Error actualizando entrenador principal:", updateClientError);
            throw updateClientError;
          }
        }
        
        // Actualizar el array de entrenadores si este no está incluido
        if (!existingClient.trainers || !existingClient.trainers.includes(trainerId)) {
          const updatedTrainers = [...(existingClient.trainers || []), trainerId];
          
          const { error: updateTrainersError } = await supabaseClient
            .from("clients")
            .update({ trainers: updatedTrainers })
            .eq("id", existingClient.id);
          
          if (updateTrainersError) {
            console.error("Error actualizando lista de entrenadores:", updateTrainersError);
            throw updateTrainersError;
          }
        }
      } else {
        // Crear nuevo registro de cliente
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
          
        if (insertError) {
          console.error("Error creando nuevo cliente:", insertError);
          throw insertError;
        }
          
        // Añadir también relación a la tabla de unión
        if (newClient && newClient.length > 0) {
          const { error: relationshipError } = await supabaseClient
            .from("client_trainer_relationships")
            .insert({
              client_id: newClient[0].id,
              trainer_id: trainerId,
              is_primary: true
            });
            
          if (relationshipError) {
            console.error("Error creando relación para nuevo cliente:", relationshipError);
            throw relationshipError;
          }
        } else {
          throw new Error("No se pudo crear el nuevo cliente correctamente");
        }
      }
      
      // Solo cuando todas las operaciones anteriores se completan con éxito, 
      // actualizar el estado de la invitación a 'aceptado'
      const { error: updateError } = await supabaseClient
        .from("client_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      if (updateError) {
        console.error("Error actualizando estado de invitación:", updateError);
        throw updateError;
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (processingError) {
      console.error("Error en la transacción:", processingError);
      throw processingError;
    }
  } catch (error) {
    console.error("Error in accept-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
