
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Home, Shield } from "lucide-react";

const UserMenu = () => {
  const { user, profile, signOut, isClient, isTrainer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  // Ir al dashboard apropiado según el tipo de usuario
  const handleDashboard = () => {
    if (isClient) {
      navigate("/client-dashboard");
    } else {
      navigate("/"); // Para entrenadores
    }
    setIsOpen(false);
  };

  // Ir al panel de administración
  const handleAdminPanel = () => {
    navigate("/admin");
    setIsOpen(false);
  };

  // Si no hay usuario, mostrar botón de login
  if (!user) {
    return (
      <Button variant="outline" onClick={handleLogin}>
        Iniciar sesión
      </Button>
    );
  }

  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (profile?.name) {
      return profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name || user?.email} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {profile?.name || user?.email}
          <p className="text-xs text-gray-500">
            {isAdmin ? 'Administrador' : profile?.role === 'client' ? 'Cliente' : 'Entrenador'}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboard}>
          <Home className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={handleAdminPanel}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Panel de Admin</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
