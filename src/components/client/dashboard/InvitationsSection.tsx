
import PendingInvitationsCard from "../PendingInvitationsCard";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const InvitationsSection = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log("InvitationsSection mounted - displaying pending invitations");
    
    // Log client email for debugging
    if (user?.email) {
      console.log("Client email:", user.email);
    }
  }, [user]);
  
  return <PendingInvitationsCard />;
};

export default InvitationsSection;
