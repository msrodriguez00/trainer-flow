import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

// Import hooks
import { useUserManagement } from "@/hooks/admin/useUserManagement";
import { useClientTrainerManagement } from "@/hooks/admin/useClientTrainerManagement";

// Import components
import UserDialogs from "@/components/admin/UserDialogs";
import UsersTab from "@/components/admin/UsersTab";
import ClientsTab from "@/components/admin/ClientsTab";
import StatsTab from "@/components/admin/StatsTab";
import ClientTrainerEditDialog from "@/components/admin/ClientTrainerEditDialog";

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  
  // Use custom hooks
  const userManagement = useUserManagement();
  const clientTrainerManagement = useClientTrainerManagement();

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
      userManagement.fetchUsers();
      clientTrainerManagement.fetchClientsAndTrainers();
    }
  }, [isAdmin]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "clients") {
      clientTrainerManagement.fetchClientsAndTrainers();
    }
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
            <TabsTrigger value="clients">Gestión de Clientes</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab 
              users={userManagement.users}
              loadingUsers={userManagement.loadingUsers}
              handleRoleChange={userManagement.handleRoleChange}
              toggleAdminStatus={userManagement.toggleAdminStatus}
              openEditModal={userManagement.openEditModal}
              openDeleteDialog={userManagement.openDeleteDialog}
              onCreateUserClick={() => userManagement.setIsCreating(true)}
            />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsTab 
              clients={clientTrainerManagement.clients}
              trainers={clientTrainerManagement.trainers}
              loadingClients={clientTrainerManagement.loadingClients}
              onEditClient={clientTrainerManagement.openEditClientModal}
            />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab users={userManagement.users} />
          </TabsContent>
        </Tabs>

        <UserDialogs 
          isCreating={userManagement.isCreating}
          setIsCreating={userManagement.setIsCreating}
          isEditing={userManagement.isEditing}
          setIsEditing={userManagement.setIsEditing}
          currentUser={userManagement.currentUser}
          setCurrentUser={userManagement.setCurrentUser}
          deleteDialogOpen={userManagement.deleteDialogOpen}
          setDeleteDialogOpen={userManagement.setDeleteDialogOpen}
          userToDelete={userManagement.userToDelete}
          setUserToDelete={userManagement.setUserToDelete}
          handleCreateUser={userManagement.handleCreateUser}
          handleUpdateUser={userManagement.handleUpdateUser}
          handleDeleteUser={userManagement.handleDeleteUser}
          isDeletingUser={userManagement.isDeletingUser}
        />

        <Dialog 
          open={clientTrainerManagement.isEditingClient} 
          onOpenChange={(open) => !open && clientTrainerManagement.setIsEditingClient(false)}
        >
          {clientTrainerManagement.currentClient && clientTrainerManagement.trainers && (
            <ClientTrainerEditDialog
              client={clientTrainerManagement.currentClient}
              trainers={clientTrainerManagement.trainers}
              onCancel={() => {
                clientTrainerManagement.setIsEditingClient(false);
                clientTrainerManagement.setCurrentClient(null);
              }}
              onSave={clientTrainerManagement.handleUpdateClientTrainers}
            />
          )}
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
