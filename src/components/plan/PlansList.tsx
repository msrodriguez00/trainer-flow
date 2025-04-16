
import { useNavigate } from "react-router-dom";
import { Plan, Client } from "@/types";
import { formatDate } from "@/utils/dateUtils";
import { ClipboardList, MoreHorizontal } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PlansListProps {
  plans: Plan[];
  clients: Client[];
  loading: boolean;
  onDeletePlan: (id: string) => Promise<void>;
}

const PlansList = ({ plans, clients, loading, onDeletePlan }: PlansListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="text-center py-10">
        <p>Cargando planes...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-medium text-gray-900">
          No hay planes aún
        </h3>
        <p className="text-gray-500 mt-1">
          ¡Crea tu primer plan para comenzar!
        </p>
        <Button className="mt-4" onClick={() => navigate("/plans/new")}>
          <ClipboardList className="mr-2 h-4 w-4" /> Crear primer plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const client = clients.find((c) => c.id === plan.clientId);
        
        return (
          <Card 
            key={plan.id}
            className="hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => navigate(`/plans/${plan.id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlan(plan.id);
                      }}
                    >
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-3">
                {client && (
                  <>
                    <img
                      src={client.avatar || "https://i.pravatar.cc/150"}
                      alt={client.name}
                      className="h-8 w-8 rounded-full mr-2"
                    />
                    <span className="text-gray-700">{client.name}</span>
                  </>
                )}
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  <span>{plan.exercises.length} ejercicios</span>
                </div>
                <div>Creado: {formatDate(plan.createdAt)}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PlansList;
