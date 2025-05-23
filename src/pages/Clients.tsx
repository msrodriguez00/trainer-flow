
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client } from "@/types";
import ClientCard from "@/components/ClientCard";
import { Plus, Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InviteClientForm from "@/components/InviteClientForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Clients = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", user.id)
        .order("name");

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = () => {
    setInviteDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    toast({
      title: "Próximamente",
      description: "La función de editar cliente estará disponible pronto",
    });
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setClients(clients.filter((client) => client.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "Se ha eliminado el cliente correctamente",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    }
  };

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    toast({
      title: "Invitación enviada",
      description: "La invitación ha sido enviada correctamente",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Clientes</h1>
          <div className="flex space-x-2">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddClient}>
                  <UserPlus className="mr-2 h-4 w-4" /> Invitar Cliente
                </Button>
              </DialogTrigger>
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
            
            <Button variant="outline" onClick={() => navigate("/client-invite")}>
              <Plus className="mr-2 h-4 w-4" /> Ver invitaciones
            </Button>
          </div>
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

        {loading ? (
          <div className="text-center py-10">
            <p>Cargando clientes...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                : "¡Invita a tu primer cliente para comenzar!"}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={handleAddClient}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Invitar cliente
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clients;
