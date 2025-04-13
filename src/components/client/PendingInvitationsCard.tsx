
import { UserPlus, RefreshCcw } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInvitations } from "@/hooks/client/useInvitations";
import { InvitationsList } from "./InvitationsList";
import { EmptyInvitations } from "./EmptyInvitations";
import { LoadingInvitations } from "./LoadingInvitations";
import { AuthRequiredMessage } from "./AuthRequiredMessage";
import { ErrorMessage } from "./ErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

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
  
  const { toast } = useToast();
  const initialLoadDone = useRef(false);
  
  // Solo ejecutar una vez después del montaje inicial
  useEffect(() => {
    // Evitar múltiples llamadas usando una referencia
    if (!initialLoadDone.current) {
      // Pequeño retraso para asegurar que la autenticación esté completamente inicializada
      const timer = setTimeout(() => {
        refreshInvitations();
        initialLoadDone.current = true;
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [refreshInvitations]);

  // Debug output
  useEffect(() => {
    console.log("PendingInvitationsCard state:", {
      loading,
      error,
      invitationsCount: invitations?.length || 0,
      invitations
    });
  }, [invitations, loading, error]);

  if (window.location.pathname === "/auth") {
    return <AuthRequiredMessage />;
  }

  return (
    <Card className="shadow-md">
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
          onClick={() => {
            toast({ description: "Actualizando invitaciones..." });
            refreshInvitations();
          }}
          disabled={loading}
          title="Actualizar invitaciones"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingInvitations />
        ) : error ? (
          <ErrorMessage error={error} onRetry={refreshInvitations} />
        ) : invitations && invitations.length > 0 ? (
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
      {!loading && !error && (!invitations || invitations.length === 0) && (
        <CardFooter className="text-center text-sm text-muted-foreground">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={refreshInvitations}
            className="mx-auto"
          >
            <RefreshCcw className="mr-2 h-3 w-3" />
            Comprobar nuevas invitaciones
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PendingInvitationsCard;
