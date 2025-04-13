
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface RecentClientsCardProps {
  clients: Client[];
  loading: boolean;
  onAddClient: () => void;
}

const RecentClientsCard = ({ clients, loading, onAddClient }: RecentClientsCardProps) => {
  const navigate = useNavigate();
  
  // Función para manejar errores de carga de imágenes
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "https://via.placeholder.com/150";
  };

  return (
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
        {loading ? (
          <div className="text-center py-4">
            <p>Cargando clientes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.length > 0 ? (
              clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <img
                    src={client.avatar || "https://via.placeholder.com/150"}
                    alt={client.name}
                    className="h-10 w-10 rounded-full mr-3 object-cover"
                    onError={handleImageError}
                  />
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No hay clientes</p>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={onAddClient}>
                <UserPlus className="h-4 w-4 mr-1" /> Añadir Cliente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentClientsCard;
