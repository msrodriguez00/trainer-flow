
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
import ClientTable from "@/components/admin/ClientTable";
import ClientTrainerEditDialog from "@/components/admin/ClientTrainerEditDialog";
import { UserFormValues } from "@/components/admin/UserForm";

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  isAdmin: boolean;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  trainers: string[] | null;
};

export type Trainer = {
  id: string;
  name: string;
};

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Client-trainer state
  const [clients, setClients] = useState<Client[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);

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
      fetchClientsAndTrainers();
    }
  }, [isAdmin]);

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

  const fetchClientsAndTrainers = async () => {
    setLoadingClients(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) {
        console.error("Error al obtener clientes:", clientsError);
        throw clientsError;
      }
      
      console.log("Clientes obtenidos:", clientsData?.length || 0);
      setClients(clientsData || []);
      
      const { data: trainersData, error: trainersError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("role", ["trainer", "admin"]);
        
      if (trainersError) {
        console.error("Error al obtener entrenadores:", trainersError);
        throw trainersError;
      }
      
      console.log("Entrenadores obtenidos:", trainersData?.length || 0);
      setTrainers(trainersData || []);
    } catch (error) {
      console.error("Error fetching clients and trainers:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de clientes y entrenadores",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
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

  const handleUpdateClientTrainers = async (clientId: string, trainerIds: string[]) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ trainers: trainerIds })
        .eq("id", clientId);

      if (error) throw error;

      setClients(clients.map(client => 
        client.id === clientId ? { ...client, trainers: trainerIds } : client
      ));

      toast({
        title: "Cliente actualizado",
        description: "Los entrenadores del cliente han sido actualizados exitosamente",
      });
      
      setIsEditingClient(false);
      setCurrentClient(null);
    } catch (error: any) {
      console.error("Error updating client trainers:", error);
      toast({
        title: "Error al actualizar cliente",
        description: error.message || "No se pudieron actualizar los entrenadores del cliente",
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

  const openEditClientModal = (client: Client) => {
    setCurrentClient(client);
    setIsEditingClient(true);
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
            <TabsTrigger value="clients">Gestión de Clientes</TabsTrigger>
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

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Clientes</CardTitle>
                <CardDescription>
                  Gestiona la asignación de entrenadores a los clientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientTable
                  clients={clients}
                  trainers={trainers}
                  loading={loadingClients}
                  onEditClient={openEditClientModal}
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

        <Dialog open={isEditingClient} onOpenChange={(open) => !open && setIsEditingClient(false)}>
          {currentClient && (
            <div>
              {trainers && (
                <ClientTrainerEditDialog
                  client={currentClient}
                  trainers={trainers}
                  onCancel={() => {
                    setIsEditingClient(false);
                    setCurrentClient(null);
                  }}
                  onSave={handleUpdateClientTrainers}
                />
              )}
            </div>
          )}
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
