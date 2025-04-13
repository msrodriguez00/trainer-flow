
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { TrainerInvitation } from "./types";

interface InvitationResponseModalProps {
  invitation: TrainerInvitation | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (invitationId: string, trainerId: string) => Promise<void>;
  onReject: (invitationId: string) => Promise<void>;
}

export const InvitationResponseModal = ({ 
  invitation, 
  isOpen, 
  onClose, 
  onAccept, 
  onReject 
}: InvitationResponseModalProps) => {
  const [processing, setProcessing] = useState(false);

  if (!invitation) return null;

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await onAccept(invitation.id, invitation.trainer_id);
    } finally {
      setProcessing(false);
      onClose();
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await onReject(invitation.id);
    } finally {
      setProcessing(false);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitación de Entrenador</DialogTitle>
          <DialogDescription>
            Has recibido una invitación para conectarte con un entrenador.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="font-medium text-lg">{invitation.trainer_name}</p>
          <p className="text-sm text-gray-500">
            Invitación enviada: {formatDate(invitation.created_at)}
          </p>
          <p className="mt-2">
            ¿Deseas aceptar esta invitación y conectarte con este entrenador?
          </p>
        </div>
        
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </>
            )}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Aceptar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
