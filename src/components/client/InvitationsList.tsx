
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainerInvitation {
  id: string;
  email: string;
  trainer_id: string;
  trainer_name: string;
  created_at: string;
}

interface InvitationsListProps {
  invitations: TrainerInvitation[];
  processingIds: string[];
  onAccept: (id: string, trainerId: string) => void;
  onReject: (id: string) => void;
  formatDate: (dateString: string) => string;
}

export const InvitationsList = ({ 
  invitations, 
  processingIds, 
  onAccept, 
  onReject,
  formatDate 
}: InvitationsListProps) => {
  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="border rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-medium">{invitation.trainer_name}</h3>
            <p className="text-sm text-gray-500">Invitación enviada el {formatDate(invitation.created_at)}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={processingIds.includes(invitation.id)}
              onClick={() => onReject(invitation.id)}
            >
              {processingIds.includes(invitation.id) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Rechazar
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              disabled={processingIds.includes(invitation.id)}
              onClick={() => onAccept(invitation.id, invitation.trainer_id)}
            >
              {processingIds.includes(invitation.id) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Aceptar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
