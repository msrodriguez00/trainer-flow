
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  trainer_id: string;
  trainer_name: string;
  created_at: string;
}

interface InvitationsListProps {
  invitations: Invitation[];
  onAccept: (invitationId: string, trainerId: string) => void;
  onReject: (invitationId: string) => void;
  processingIds: string[];
  formatDate: (date: string) => string;
}

export const InvitationsList = ({
  invitations,
  onAccept,
  onReject,
  processingIds,
  formatDate
}: InvitationsListProps) => {
  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg"
        >
          <div className="mb-3 md:mb-0">
            <p className="font-medium">{invitation.trainer_name}</p>
            <p className="text-sm text-gray-600">
              Invitación enviada: {formatDate(invitation.created_at)}
            </p>
          </div>
          <div className="flex space-x-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none"
              onClick={() => onReject(invitation.id)}
              disabled={processingIds.includes(invitation.id)}
            >
              {processingIds.includes(invitation.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="mr-1 h-4 w-4" />
                  Rechazar
                </>
              )}
            </Button>
            <Button
              size="sm"
              className="flex-1 md:flex-none"
              onClick={() => onAccept(invitation.id, invitation.trainer_id)}
              disabled={processingIds.includes(invitation.id)}
            >
              {processingIds.includes(invitation.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Aceptar
                </>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
