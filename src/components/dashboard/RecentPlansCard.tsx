
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plan, Client } from "@/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RecentPlansCardProps {
  plans: Plan[];
  clients: Client[];
  loading: boolean;
  onCreatePlan: () => void;
}

const RecentPlansCard = ({ plans, clients, loading, onCreatePlan }: RecentPlansCardProps) => {
  const navigate = useNavigate();
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Planes Recientes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/plans")}>
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <p>Cargando planes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.length > 0 ? (
              plans.map((plan) => {
                const client = clients.find((c) => c.id === plan.clientId);
                
                return (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/plans/${plan.id}`)}
                  >
                    <div className="flex items-center">
                      {client && (
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage 
                            src={client.avatar || undefined} 
                            alt={client.name} 
                          />
                          <AvatarFallback>
                            {client.name ? getInitials(client.name) : "CL"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <h3 className="font-medium">{plan.name}</h3>
                        <p className="text-sm text-gray-500">
                          {client?.name || "Cliente"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No hay planes recientes</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={onCreatePlan}
                >
                  Crear primer plan
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPlansCard;
