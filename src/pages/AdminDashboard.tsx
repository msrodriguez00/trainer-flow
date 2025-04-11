import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, MoreHorizontal, UserCog } from "lucide-react";

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

type User = {
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
            .rpc('check_if_admin', { user_id: profile.id });
            
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
      const response = await fetch(`https://bhmnazydmfklmhsunafx.supabase.co/rest/v1/rpc/update_user_role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobW5henlkbWZrbG1oc3VuYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTk0ODIsImV4cCI6MjA1OTk3NTQ4Mn0.s07hjV8EueBVLSZHyOYBqYfLbvQCoKAoRNfrDcJS5u4`,
          'apikey': `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJobW5henlkbWZrbG1oc3VuYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTk0ODIsImV4cCI6MjA1OTk3NTQ4Mn0.s07hjV8EueBVLSZHyOYBqYfLbvQCoKAoRNfrDcJS5u4`,
        },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating role:", errorData);
        throw new Error(errorData.message || "Error updating role");
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
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Gestiona los roles y permisos de los usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-6">Cargando usuarios...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-6">No se encontraron usuarios</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead className="w-[80px]">Acciones</TableHead>
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
                          <TableCell>{user.id}</TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Usuarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Entrenadores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {users.filter(u => u.role === "trainer").length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Clientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {users.filter(u => u.role === "client").length}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
