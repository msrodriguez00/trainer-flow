
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockClients } from "@/data/mockData";
import { Client } from "@/types";
import ClientCard from "@/components/ClientCard";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>(mockClients);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClient = (client: Client) => {
    toast({
      title: "Próximamente",
      description: "La función de editar cliente estará disponible pronto",
    });
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter((client) => client.id !== id));
    toast({
      title: "Cliente eliminado",
      description: "Se ha eliminado el cliente correctamente",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Clientes</h1>
          <Button onClick={() => {
            toast({
              title: "Próximamente",
              description: "La función de añadir cliente estará disponible pronto",
            });
          }}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Cliente
          </Button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Buscar clientes por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredClients.length > 0 ? (
          <div className="client-grid">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900">
              {searchTerm
                ? "No se encontraron clientes"
                : "No hay clientes aún"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm
                ? "Intenta con otra búsqueda"
                : "¡Añade tu primer cliente para comenzar!"}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={() => {
                  toast({
                    title: "Próximamente",
                    description: "La función de añadir cliente estará disponible pronto",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Añadir cliente
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clients;
