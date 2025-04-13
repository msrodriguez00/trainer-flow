
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Trainer {
  id: string;
  name: string;
}

interface InvitationHandlerProps {
  onInvitationLoaded: (data: {
    email: string;
    trainerId: string;
    trainers: Trainer[];
    invitationId: string;
  }) => void;
}

export const InvitationHandler = ({ onInvitationLoaded }: InvitationHandlerProps) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const email = searchParams.get("email");
    
    if (email) {
      const fetchInvitationData = async () => {
        try {
          // Fetch the invitation directly by email
          const { data: invitationData, error: invitationError } = await supabase
            .from("client_invitations")
            .select("*")
            .eq("email", email.toLowerCase())
            .eq("status", "pending")
            .maybeSingle();
            
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
              .eq("email", email.toLowerCase());
              
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
            
            onInvitationLoaded({
              email,
              trainerId: invitationData.trainer_id,
              trainers,
              invitationId: invitationData.id,
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
