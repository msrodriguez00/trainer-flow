
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "@/pages/AdminDashboard";

interface DeleteUserDialogProps {
  userToDelete: User | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteUserDialog = ({ userToDelete, onCancel, onConfirm }: DeleteUserDialogProps) => {
  if (!userToDelete) return null;
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Confirmar eliminación
        </DialogTitle>
        <DialogDescription>
          ¿Estás seguro de que deseas eliminar al usuario {userToDelete.name || userToDelete.email}? Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button 
          variant="destructive" 
          onClick={onConfirm}
        >
          Eliminar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteUserDialog;
