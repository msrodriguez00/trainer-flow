
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/components/admin/types";
import { UserFormValues } from "@/components/admin/UserForm";

export const useUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error al obtener perfiles:", profilesError);
        throw profilesError;
      }

      const processedUsers = (profiles || []).map((profile) => {
        return {
          id: profile.id,
          email: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
          role: profile.role,
          isAdmin: profile.role === 'admin'
        };
      });

      console.log("Usuarios procesados:", processedUsers.length);
      setUsers(processedUsers);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      });

      if (error) {
        console.error("Error updating role:", error);
        throw error;
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole, isAdmin: newRole === 'admin' } : user
      ));

      toast({
        title: "Rol actualizado",
        description: `Usuario actualizado a ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const newRole = currentIsAdmin ? 
        (user.role === 'admin' ? 'client' : user.role) : 
        'admin';
      
      const { error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole, isAdmin: newRole === 'admin' } : user
      ));

      toast({
        title: "Estado de administrador actualizado",
        description: currentIsAdmin 
          ? "Usuario ya no es administrador" 
          : "Usuario ahora es administrador",
      });
    } catch (error) {
      console.error("Error toggling admin status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de administrador",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (data: UserFormValues) => {
    try {
      if (!data.password) {
        toast({
          title: "Error",
          description: "La contraseña es requerida para crear un usuario",
          variant: "destructive",
        });
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name,
        },
      });

      if (authError) {
        console.error("Error creating user:", authError);
        throw authError;
      }

      if (authData.user) {
        const isAdmin = data.isAdmin;
        const role = isAdmin ? 'admin' : (data.role || 'client');
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            name: data.name,
            role: role,
          })
          .eq("id", authData.user.id);
          
        if (updateError) throw updateError;

        toast({
          title: "Usuario creado",
          description: `Usuario ${data.email} creado exitosamente`,
        });

        fetchUsers();
        setIsCreating(false);
      }
    } catch (error: any) {
      console.error("Error in handleCreateUser:", error);
      toast({
        title: "Error al crear usuario",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (data: UserFormValues) => {
    try {
      if (!currentUser) return;

      const newRole = data.isAdmin ? 'admin' : (data.role || currentUser.role || 'client');

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          role: newRole,
        })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;

      if (data.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          currentUser.id,
          { password: data.password }
        );

        if (passwordError) throw passwordError;
      }

      toast({
        title: "Usuario actualizado",
        description: `Usuario ${data.email} actualizado exitosamente`,
      });

      fetchUsers();
      setIsEditing(false);
      setCurrentUser(null);
    } catch (error: any) {
      console.error("Error in handleUpdateUser:", error);
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!userToDelete) return;

      const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuario eliminado",
        description: `Usuario ${userToDelete.email} eliminado exitosamente`,
      });

      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error in handleDeleteUser:", error);
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setIsEditing(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  return {
    users,
    loadingUsers,
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
    fetchUsers,
    handleRoleChange,
    toggleAdminStatus,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    openEditModal,
    openDeleteDialog
  };
};
