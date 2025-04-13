
import { UserPlus, RefreshCcw } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    formatDate,
    refreshInvitations
  } = useInvitations();

  if (window.location.pathname === "/auth") {
    return <AuthRequiredMessage />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Invitaciones de Entrenadores
          </CardTitle>
          {invitations.length > 0 && (
            <CardDescription>
              Tienes {invitations.length} invitación(es) pendiente(s)
            </CardDescription>
          )}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={refreshInvitations}
          disabled={loading}
          title="Actualizar invitaciones"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
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
