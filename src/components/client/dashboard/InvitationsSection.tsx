import PendingInvitationsCard from "../PendingInvitationsCard";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const InvitationsSection = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log("InvitationsSection mounted - displaying pending invitations");
    
    // Log client email for debugging
    if (user?.email) {
      console.log("Client email:", user.email);
      
      const checkClientRecord = async () => {
        // Verificar existencia del cliente
        const { data: clientData, error } = await supabase
          .from("clients")
          .select("id, email, user_id, trainer_id, trainers")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
          
        console.log("Cliente por email:", clientData, error);
        
        // Verificar por user_id
        const { data: clientByUserId } = await supabase
          .from("clients")
          .select("id, email, user_id, trainer_id, trainers")
          .eq("user_id", user.id)
          .maybeSingle();
          
        console.log("Cliente por user_id:", clientByUserId);
      };
      
      checkClientRecord();
    }
  }, [user]);
  
  return <PendingInvitationsCard />;
};

export default InvitationsSection;
