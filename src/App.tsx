
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientLogin from "./pages/ClientLogin";
import Profile from "./pages/Profile";
import Exercises from "./pages/Exercises";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Clients from "./pages/Clients";
import ClientInvite from "./pages/ClientInvite";
import Plans from "./pages/Plans";
import ClientDashboard from "./pages/ClientDashboard"; 
import AdminDashboard from "./pages/AdminDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import NotFound from "./pages/NotFound";
import NewPlanForm from "./components/NewPlanForm";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, clientOnly = false, trainerOnly = false, adminOnly = false }: 
  { children: React.ReactNode, clientOnly?: boolean, trainerOnly?: boolean, adminOnly?: boolean }) => {
  const { user, isLoading, isClient, isTrainer, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Debug para la ruta de admin
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

const NewPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientId = queryParams.get("clientId") || undefined;
  const { toast } = useToast();

  const handleCreatePlan = (plan: {
    name: string;
    clientId: string;
    exercises: any[];
  }) => {
    toast({
      title: "Plan creado",
      description: `Se ha creado "${plan.name}" correctamente.`,
    });
    navigate("/plans");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <NewPlanForm
          initialClientId={clientId}
          onSubmit={handleCreatePlan}
        />
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/client-login" element={<ClientLogin />} />
            <Route path="/" element={
              <ProtectedRoute>
                <IndexRedirect />
              </ProtectedRoute>
            } />
            <Route path="/trainer-dashboard" element={
              <ProtectedRoute trainerOnly>
                <TrainerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/exercises" element={
              <ProtectedRoute trainerOnly>
                <Exercises />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute trainerOnly>
                <ExerciseLibrary />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute trainerOnly>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/client-invite" element={
              <ProtectedRoute trainerOnly>
                <ClientInvite />
              </ProtectedRoute>
            } />
            <Route path="/plans" element={
              <ProtectedRoute trainerOnly>
                <Plans />
              </ProtectedRoute>
            } />
            <Route path="/plans/new" element={
              <ProtectedRoute trainerOnly>
                <NewPlanPage />
              </ProtectedRoute>
            } />
            <Route path="/client-dashboard" element={
              <ProtectedRoute clientOnly>
                <ClientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

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

export default App;
