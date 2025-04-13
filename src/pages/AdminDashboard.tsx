
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, MoreHorizontal, UserCog, UserPlus, Trash2, Edit, AlertCircle } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  isAdmin: boolean;
};

// Esquema de validación para el formulario de creación/edición de usuarios
const userFormSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  name: z.string().min(1, "El nombre es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  role: z.enum(["client", "trainer", ""]).optional(),
  isAdmin: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

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

  // Formulario para creación y edición de usuarios
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "",
      isAdmin: false,
    },
  });

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

  // Efecto para actualizar el formulario cuando se selecciona un usuario para editar
  useEffect(() => {
    if (currentUser && isEditing) {
      form.reset({
        email: currentUser.email,
        name: currentUser.name || "",
        role: (currentUser.role as any) || "",
        isAdmin: currentUser.isAdmin,
      });
    }
  }, [currentUser, isEditing, form]);

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
          // Usar is_admin_user en lugar de check_if_admin
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
        form.reset();
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
      form.reset();
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuarios</CardTitle>
                  <CardDescription>
                    Gestiona los roles y permisos de los usuarios.
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  form.reset({
                    email: "",
                    name: "",
                    password: "",
                    role: "",
                    isAdmin: false,
                  });
                  setIsCreating(true);
                }} className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Usuario
                </Button>
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

      {/* Modal de creación de usuario */}
      <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa el formulario para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        {...field}
                      >
                        <option value="">Selecciona un rol</option>
                        <option value="client">Cliente</option>
                        <option value="trainer">Entrenador</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Administrador</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este usuario tendrá acceso completo al panel de administración.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Crear Usuario</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de usuario */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="correo@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Dejar en blanco para mantener" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        {...field}
                      >
                        <option value="">Sin rol</option>
                        <option value="client">Cliente</option>
                        <option value="trainer">Entrenador</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Administrador</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Este usuario tendrá acceso completo al panel de administración.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentUser(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Usuario</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario {userToDelete?.name || userToDelete?.email}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
