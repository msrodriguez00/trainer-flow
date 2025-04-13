
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

// Import refactored components
import UserTable from "@/components/admin/UserTable";
import StatsCards from "@/components/admin/StatsCards";
import UserDialogs from "@/components/admin/UserDialogs";
import { UserFormValues } from "@/components/admin/UserForm";

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  isAdmin: boolean;
};

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Necesitas ser administrador para acceder a esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log("Iniciando fetchUsers...");
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error al obtener perfiles:", profilesError);
        throw profilesError;
      }

      console.log("Perfiles obtenidos:", profiles?.length || 0);

      const usersWithAdminStatus = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: isAdminUser, error: adminCheckError } = await supabase
            .rpc('is_admin_user', { user_id: profile.id });
            
          if (adminCheckError) {
            console.error(`Error checking admin status for user ${profile.id}:`, adminCheckError);
          }

          return {
            id: profile.id,
            email: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url,
            role: profile.role,
            isAdmin: !!isAdminUser
          };
        })
      );

      console.log("Usuarios procesados con estado de admin:", usersWithAdminStatus.length);
      setUsers(usersWithAdminStatus);
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
        user.id === userId ? { ...user, role: newRole } : user
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
      if (currentIsAdmin) {
        const { error } = await supabase
          .from("admin_users")
          .delete()
          .eq("id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_users")
          .insert({ id: userId });

        if (error) throw error;
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !currentIsAdmin } : user
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

      // Crear el usuario en Supabase Auth
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
        // Actualizar el perfil con el rol
        if (data.role) {
          await supabase.rpc('update_user_role', {
            user_id: authData.user.id,
            new_role: data.role
          });
        }

        // Si debe ser admin, añadirlo a la tabla de admins
        if (data.isAdmin) {
          await supabase
            .from("admin_users")
            .insert({ id: authData.user.id });
        }

        toast({
          title: "Usuario creado",
          description: `Usuario ${data.email} creado exitosamente`,
        });

        // Actualizar la lista de usuarios
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

      // Actualizar el perfil con los nuevos datos
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          role: data.role || null,
        })
        .eq("id", currentUser.id);

      if (updateError) throw updateError;

      // Si cambió el estado de admin
      if (data.isAdmin !== currentUser.isAdmin) {
        await toggleAdminStatus(currentUser.id, currentUser.isAdmin);
      }

      // Si se proporcionó una nueva contraseña
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

      // Actualizar la lista de usuarios
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

      // Eliminar el usuario de Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuario eliminado",
        description: `Usuario ${userToDelete.email} eliminado exitosamente`,
      });

      // Actualizar la lista de usuarios
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuarios</CardTitle>
                  <CardDescription>
                    Gestiona los roles y permisos de los usuarios.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreating(true)} className="flex items-center">
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
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
                <CardDescription>
                  Vista general de las estadísticas de la plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsCards users={users} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Dialogs Component */}
        <UserDialogs 
          isCreating={isCreating}
          setIsCreating={setIsCreating}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          userToDelete={userToDelete}
          setUserToDelete={setUserToDelete}
          handleCreateUser={handleCreateUser}
          handleUpdateUser={handleUpdateUser}
          handleDeleteUser={handleDeleteUser}
        />
      </main>
    </div>
  );
};

export default AdminDashboard;
