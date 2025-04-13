
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { User } from "@/pages/AdminDashboard";
import UserForm, { UserFormValues } from "./UserForm";
import DeleteUserDialog from "./DeleteUserDialog";

interface UserDialogsProps {
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (value: boolean) => void;
  userToDelete: User | null;
  setUserToDelete: (user: User | null) => void;
  handleCreateUser: (data: UserFormValues) => void;
  handleUpdateUser: (data: UserFormValues) => void;
  handleDeleteUser: () => void;
}

const UserDialogs = ({
  isCreating,
  setIsCreating,
  isEditing,
  setIsEditing,
  currentUser,
  setCurrentUser,
  deleteDialogOpen,
  setDeleteDialogOpen,
  userToDelete,
  setUserToDelete,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
}: UserDialogsProps) => {
  return (
    <>
      {/* Modal de creación de usuario */}
      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <UserForm 
          onSubmit={handleCreateUser} 
          onCancel={() => setIsCreating(false)}
        />
      </Dialog>

      {/* Modal de edición de usuario */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        {currentUser && (
          <UserForm 
            onSubmit={handleUpdateUser} 
            onCancel={() => {
              setIsEditing(false);
              setCurrentUser(null);
            }}
            defaultValues={{
              email: currentUser.email,
              name: currentUser.name || "",
              role: (currentUser.role as any) || "",
              isAdmin: currentUser.isAdmin,
              password: "",
            }}
            isEditing={true}
          />
        )}
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteUserDialog 
          userToDelete={userToDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteUser}
        />
      </Dialog>
    </>
  );
};

export default UserDialogs;
