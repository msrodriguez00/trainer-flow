
import { UserPlus } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useInvitations } from "@/hooks/client/useInvitations";
import { InvitationsList } from "./InvitationsList";
import { EmptyInvitations } from "./EmptyInvitations";
import { LoadingInvitations } from "./LoadingInvitations";
import { AuthRequiredMessage } from "./AuthRequiredMessage";
import { ErrorMessage } from "./ErrorMessage";

const PendingInvitationsCard = () => {
  const {
    invitations,
    loading,
    error,
    processingIds,
    handleAcceptInvitation,
    handleRejectInvitation,
    formatDate
  } = useInvitations();

  if (window.location.pathname === "/auth") {
    return <AuthRequiredMessage />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Invitaciones de Entrenadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingInvitations />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : invitations.length > 0 ? (
          <InvitationsList 
            invitations={invitations} 
            onAccept={handleAcceptInvitation} 
            onReject={handleRejectInvitation} 
            processingIds={processingIds}
            formatDate={formatDate}
          />
        ) : (
          <EmptyInvitations />
        )}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsCard;
