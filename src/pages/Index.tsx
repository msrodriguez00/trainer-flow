
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, ClipboardList, Plus, BookOpen } from "lucide-react";
import { mockExercises, mockClients, mockPlans } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats] = useState({
    exercises: mockExercises.length,
    clients: mockClients.length,
    plans: mockPlans.length,
  });
  
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
    toast({
      title: "Próximamente",
      description: "Función de añadir cliente estará disponible pronto",
    });
  };

  const recentPlans = mockPlans.slice(0, 3);
  const recentClients = mockClients.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" /> Crear Plan
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ejercicios</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.exercises}</h3>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clientes</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.clients}</h3>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Planes</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.plans}</h3>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Biblioteca</p>
                <Button variant="link" className="p-0 h-auto text-primary" onClick={handleGoToLibrary}>
                  Ver biblioteca
                </Button>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent plans */}
          <div className="lg:col-span-2">
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
                <div className="space-y-4">
                  {recentPlans.length > 0 ? (
                    recentPlans.map((plan) => {
                      const client = mockClients.find((c) => c.id === plan.clientId);
                      return (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/plans/${plan.id}`)}
                        >
                          <div className="flex items-center">
                            {client && (
                              <img
                                src={client.avatar}
                                alt={client.name}
                                className="h-10 w-10 rounded-full mr-3"
                              />
                            )}
                            <div>
                              <h3 className="font-medium">{plan.name}</h3>
                              <p className="text-sm text-gray-500">
                                {client?.name || "Cliente"}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.exercises.length} ejercicios
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
                        onClick={handleCreatePlan}
                      >
                        Crear primer plan
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent clients */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Clientes Recientes</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
                    Ver todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="h-10 w-10 rounded-full mr-3"
                      />
                      <div>
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={handleAddClient}>
                      <Plus className="h-4 w-4 mr-1" /> Añadir Cliente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={handleCreateExercise}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Dumbbell className="mr-2 h-4 w-4" />
                    Añadir ejercicio nuevo
                  </Button>
                  <Button
                    onClick={handleGoToLibrary}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Explorar biblioteca de ejercicios
                  </Button>
                  <Button
                    onClick={handleCreatePlan}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Crear nuevo plan
                  </Button>
                  <Button
                    onClick={handleAddClient}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Añadir cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
