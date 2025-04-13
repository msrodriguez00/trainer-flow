
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Trainer {
  id: string;
  name: string;
}

interface InvitationData {
  trainer_id: string;
  token: string;
  email: string;
  trainer?: {
    name: string;
  };
}

interface InvitationHandlerProps {
  onInvitationLoaded: (data: {
    email: string;
    trainerId: string;
    trainers: Trainer[];
    invitationData: InvitationData;
  }) => void;
}

export const InvitationHandler = ({ onInvitationLoaded }: InvitationHandlerProps) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    
    if (token && email) {
      const fetchInvitationData = async () => {
        try {
          // First fetch the invitation
          const { data: invitationData, error: invitationError } = await supabase
            .from("client_invitations")
            .select("*")
            .eq("token", token)
            .eq("email", email)
            .single();
            
          if (invitationError) throw invitationError;
          
          if (invitationData) {
            // Then fetch the trainer separately
            const { data: trainerData, error: trainerError } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", invitationData.trainer_id)
              .single();
              
            if (trainerError) throw trainerError;
            
            // Check for existing clients with this email
            const { data: existingClients, error: existingClientsError } = await supabase
              .from("clients")
              .select("*")
              .eq("email", email);
              
            if (existingClientsError) throw existingClientsError;
            
            if (existingClients && existingClients.length > 0) {
              toast({
                title: "Cliente ya registrado",
                description: "Ya estás registrado en el sistema. Por favor, inicia sesión.",
              });
              window.location.href = "/client-login";
              return;
            }
            
            // Fetch trainer profiles for dropdown
            const { data: trainerProfiles, error: trainerProfilesError } = await supabase
              .from("profiles")
              .select("id, name")
              .in("id", [invitationData.trainer_id]);
              
            if (trainerProfilesError) throw trainerProfilesError;
            
            const trainers: Trainer[] = trainerProfiles || [];
            
            // Combine invitation and trainer data
            const combinedInvitationData: InvitationData = {
              ...invitationData,
              trainer: {
                name: trainerData?.name || "Unnamed Trainer"
              }
            };
            
            onInvitationLoaded({
              email,
              trainerId: invitationData.trainer_id,
              trainers,
              invitationData: combinedInvitationData,
            });
          }
        } catch (error) {
          console.error("Error fetching invitation:", error);
        }
      };
      
      fetchInvitationData();
    }
  }, [searchParams, onInvitationLoaded, toast]);

  return null;
};
