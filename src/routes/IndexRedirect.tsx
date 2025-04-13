
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";

const IndexRedirect = () => {
  const { isClient, isTrainer, isAdmin, profile } = useAuth();
  
  console.log("IndexRedirect - User role:", { isClient, isTrainer, isAdmin, profile });
  
  if (isAdmin) {
    console.log("Redirigiendo admin al panel de administración");
    return <Navigate to="/admin" replace />;
  }
  
  if (isTrainer) {
    console.log("Redirecting trainer to trainer dashboard");
    return <Navigate to="/trainer-dashboard" replace />;
  }
  
  if (isClient) {
    return <Navigate to="/client-dashboard" replace />;
  }
  
  return <Index />;
};

export default IndexRedirect;
