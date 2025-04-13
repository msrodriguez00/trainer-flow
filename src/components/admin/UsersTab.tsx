
import React from "react";
import { User } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import UserTable from "./UserTable";

interface UsersTabProps {
  users: User[];
  loadingUsers: boolean;
  handleRoleChange: (userId: string, newRole: string) => void;
  toggleAdminStatus: (userId: string, currentIsAdmin: boolean) => void;
  openEditModal: (user: User) => void;
  openDeleteDialog: (user: User) => void;
  onCreateUserClick: () => void;
}

const UsersTab = ({
  users,
  loadingUsers,
  handleRoleChange,
  toggleAdminStatus,
  openEditModal,
  openDeleteDialog,
  onCreateUserClick
}: UsersTabProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Gestiona los roles y permisos de los usuarios.
          </CardDescription>
        </div>
        <Button onClick={onCreateUserClick} className="flex items-center">
          <UserPlus className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </CardHeader>
      <CardContent>
        <UserTable 
          users={users}
          loadingUsers={loadingUsers}
          handleRoleChange={handleRoleChange}
          toggleAdminStatus={toggleAdminStatus}
          openEditModal={openEditModal}
          openDeleteDialog={openDeleteDialog}
        />
      </CardContent>
    </Card>
  );
};

export default UsersTab;
