
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  clientOnly?: boolean;
  trainerOnly?: boolean;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  clientOnly = false, 
  trainerOnly = false, 
  adminOnly = false 
}: ProtectedRouteProps) => {
  const { user, isLoading, isClient, isTrainer, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly) {
    console.log("Ruta protegida de admin:", { isAdmin });
    if (!isAdmin) {
      console.log("Acceso denegado: Usuario no es admin");
      return <Navigate to="/" replace />;
    }
  }

  if (trainerOnly && !isTrainer && !isAdmin) {
    return <Navigate to="/client-dashboard" replace />;
  }

  if (clientOnly && !isClient && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
