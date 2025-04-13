
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plan } from "@/types";
import { Link } from "react-router-dom";
import { ListPlus, ClipboardList, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientPlansListProps {
  plans: Plan[];
  clientId: string;
}

const ClientPlansList: React.FC<ClientPlansListProps> = ({ plans, clientId }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Planes de Entrenamiento</CardTitle>
        <Button variant="outline" asChild size="sm">
          <Link to={`/plans/new?clientId=${clientId}`}>
            <ListPlus className="mr-2 h-4 w-4" />
            Crear Plan
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start space-x-3 mb-3 md:mb-0">
                  <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">{plan.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <CalendarClock className="h-3.5 w-3.5 mr-1" />
                      <span>
                        {format(new Date(plan.createdAt), "d MMM yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <div className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs">
                    {plan.exercises.length} ejercicios
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/plans/${plan.id}`}>Ver detalles</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium mb-1">No hay planes creados</h3>
            <p className="text-sm text-gray-500 mb-4">
              Este cliente aún no tiene planes de entrenamiento asignados
            </p>
            <Button asChild>
              <Link to={`/plans/new?clientId=${clientId}`}>
                <ListPlus className="mr-2 h-4 w-4" />
                Crear Plan Ahora
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientPlansList;
