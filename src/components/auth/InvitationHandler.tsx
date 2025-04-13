
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
          const { data, error } = await supabase
            .from("client_invitations")
            .select("*, trainer:trainer_id(name)")
            .eq("token", token)
            .eq("email", email)
            .single();
            
          if (error) throw error;
          
          if (data) {
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
            
            const { data: trainerProfiles, error: trainerProfilesError } = await supabase
              .from("profiles")
              .select("id, name")
              .in("id", [data.trainer_id]);
              
            if (trainerProfilesError) throw trainerProfilesError;
            
            const trainers: Trainer[] = trainerProfiles || [];
            
            onInvitationLoaded({
              email,
              trainerId: data.trainer_id,
              trainers,
              invitationData: data,
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
