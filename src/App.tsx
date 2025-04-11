
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
import NotFound from "./pages/NotFound";
import NewPlanForm from "./components/NewPlanForm";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

// Ruta protegida que verifica si el usuario está autenticado
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/library" element={<ExerciseLibrary />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/plans/new" element={
              <ProtectedRoute>
                <NewPlanPage />
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
