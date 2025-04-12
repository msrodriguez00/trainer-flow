
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dumbbell, Users, ClipboardList, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Client, Plan } from "@/types";
import InviteClientForm from "@/components/InviteClientForm";

// Import the new components
import DashboardStatsCard from "@/components/dashboard/DashboardStatsCard";
import RecentPlansCard from "@/components/dashboard/RecentPlansCard";
import RecentClientsCard from "@/components/dashboard/RecentClientsCard";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";

// Import services
import { fetchDashboardStats, fetchRecentPlans, fetchRecentClients } from "@/services/dashboardService";

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    exercises: 0,
    clients: 0,
    plans: 0,
  });
  const [recentPlans, setRecentPlans] = useState<Plan[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const stats = await fetchDashboardStats(user.id);
      const plans = await fetchRecentPlans(user.id);
      const clients = await fetchRecentClients(user.id);
      
      setStats(stats);
      setRecentPlans(plans);
      setRecentClients(clients);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del panel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    navigate("/plans/new");
  };

  const handleCreateExercise = () => {
    navigate("/exercises/new");
  };

  const handleGoToLibrary = () => {
    navigate("/library");
  };

  const handleAddClient = () => {
    setInviteDialogOpen(true);
  };
  
  const handleManageInvites = () => {
    navigate("/client-invite");
  };
  
  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    loadDashboardData();
    toast({
      title: "Invitación enviada",
      description: "La invitación ha sido enviada correctamente",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Entrenador</h1>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" /> Crear Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <DashboardStatsCard 
            title="Ejercicios" 
            value={stats.exercises} 
            icon={<Dumbbell className="h-6 w-6 text-primary" />} 
          />
          
          <DashboardStatsCard 
            title="Clientes" 
            value={stats.clients} 
            icon={<Users className="h-6 w-6 text-primary" />} 
          />
          
          <DashboardStatsCard 
            title="Planes" 
            value={stats.plans} 
            icon={<ClipboardList className="h-6 w-6 text-primary" />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentPlansCard
              plans={recentPlans}
              clients={recentClients}
              loading={loading}
              onCreatePlan={handleCreatePlan}
            />
          </div>

          <div>
            <RecentClientsCard
              clients={recentClients}
              loading={loading}
              onAddClient={handleAddClient}
            />

            <QuickActionsCard
              onCreateExercise={handleCreateExercise}
              onGoToLibrary={handleGoToLibrary}
              onCreatePlan={handleCreatePlan}
              onAddClient={handleAddClient}
              onManageInvites={handleManageInvites}
            />
          </div>
        </div>
      </main>
      
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar nuevo cliente</DialogTitle>
            <DialogDescription>
              Envía una invitación para que un cliente se una a tu plataforma.
            </DialogDescription>
          </DialogHeader>
          <InviteClientForm onSuccess={handleInviteSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerDashboard;
