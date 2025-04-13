
import PendingInvitationsCard from "../PendingInvitationsCard";
import { useEffect } from "react";

const InvitationsSection = () => {
  useEffect(() => {
    console.log("InvitationsSection mounted - displaying pending invitations");
  }, []);
  
  return <PendingInvitationsCard />;
};

export default InvitationsSection;
