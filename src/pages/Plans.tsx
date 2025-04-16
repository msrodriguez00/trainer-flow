
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePlansManagement } from "@/hooks/usePlansManagement";
import PlansList from "@/components/plan/PlansList";
import PlansSearchBar from "@/components/plan/PlansSearchBar";
import EmptySearchResults from "@/components/plan/EmptySearchResults";

const Plans = () => {
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    clients,
    loading,
    filteredPlans,
    handleDeletePlan,
  } = usePlansManagement();

  const handleCreatePlan = () => {
    navigate("/plans/new");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Planes</h1>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" /> Crear Plan
          </Button>
        </div>

        <PlansSearchBar 
          searchTerm={searchTerm} 
          onSearchTermChange={setSearchTerm} 
        />

        {filteredPlans.length === 0 && searchTerm ? (
          <EmptySearchResults searchTerm={searchTerm} />
        ) : (
          <PlansList
            plans={filteredPlans}
            clients={clients}
            loading={loading}
            onDeletePlan={handleDeletePlan}
          />
        )}
      </main>
    </div>
  );
};

export default Plans;
