
import { useState } from "react";
import { User } from "@/pages/AdminDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

interface UserTableProps {
  users: User[];
  loadingUsers: boolean;
  handleRoleChange: (userId: string, newRole: string) => void;
  toggleAdminStatus: (userId: string, currentIsAdmin: boolean) => void;
  openEditModal: (user: User) => void;
  openDeleteDialog: (user: User) => void;
}

const UserTable = ({
  users,
  loadingUsers,
  handleRoleChange,
  toggleAdminStatus,
  openEditModal,
  openDeleteDialog,
}: UserTableProps) => {
  
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loadingUsers) {
    return <div className="text-center py-6">Cargando usuarios...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-6">No se encontraron usuarios</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead className="w-[150px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(user.name, user.id)}
                </AvatarFallback>
              </Avatar>
              <span>{user.name || "Sin nombre"}</span>
            </TableCell>
            <TableCell className="font-mono text-xs truncate max-w-[100px]">{user.id}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === 'trainer'
                  ? 'bg-blue-100 text-blue-800'
                  : user.role === 'client'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {user.role || "Sin rol"}
              </span>
            </TableCell>
            <TableCell>
              {user.isAdmin ? (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                  Admin
                </span>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => openEditModal(user)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => openDeleteDialog(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "client")}
                    >
                      Establecer como Cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "trainer")}
                    >
                      Establecer como Entrenador
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                    >
                      {user.isAdmin ? "Quitar Admin" : "Hacer Admin"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
