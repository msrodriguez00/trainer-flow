
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
import Profile from "./pages/Profile";
import Exercises from "./pages/Exercises";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Clients from "./pages/Clients";
import Plans from "./pages/Plans";
import ClientDashboard from "./pages/ClientDashboard"; 
import AdminDashboard from "./pages/AdminDashboard"; // Importamos el panel de administrador
import NotFound from "./pages/NotFound";
import NewPlanForm from "./components/NewPlanForm";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

// Mejorada la protección de rutas, que redirige a la página adecuada según el tipo de usuario
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

  // Redirigir si la ruta requiere ser administrador
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Redirigir a los clientes a su dashboard
  if (trainerOnly && !isTrainer && !isAdmin) {
    return <Navigate to="/client-dashboard" replace />;
  }

  // Redirigir a los entrenadores al dashboard principal
  if (clientOnly && !isClient && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Create new plans page
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
    // In a real app, we would save this to a database
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
            <Route path="/" element={
              <ProtectedRoute trainerOnly>
                <Index />
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
            {/* Nueva ruta para el panel de administración */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
