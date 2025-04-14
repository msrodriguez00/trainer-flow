
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import NewPlanForm from "@/components/NewPlanForm";
import Navbar from "@/components/Navbar";

const NewPlanPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientId = queryParams.get("clientId") || undefined;
  const { toast } = useToast();

  const handleCreatePlan = (plan: {
    name: string;
    clientId: string;
    month?: string;
    exercises: any[];
    sessions?: any[];
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

export default NewPlanPage;
