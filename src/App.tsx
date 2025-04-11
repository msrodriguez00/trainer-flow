
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Exercises from "./pages/Exercises";
import Clients from "./pages/Clients";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import NewPlanForm from "./components/NewPlanForm";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

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

import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

// Add uuid as a dependency
import { v4 as uuidv4 } from "uuid";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/new" element={<NewPlanPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
