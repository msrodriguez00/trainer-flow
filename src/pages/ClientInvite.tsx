
import { useState } from "react";
import Navbar from "@/components/Navbar";
import InviteClientForm from "@/components/InviteClientForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";

const ClientInvite = () => {
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_invitations")
        .select("*")
        .eq("trainer_id", user.id)
        .eq("accepted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las invitaciones pendientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch invitations on component mount
  useState(() => {
    fetchInvitations();
  });

  const handleResendInvitation = async (invitation: any) => {
    // In a real-world app, this would resend the email with the invitation link
    toast({
      title: "Invitación reenviada",
      description: `Se ha reenviado la invitación a ${invitation.email}.`,
    });
    
    console.log(`Resend invitation link: ${window.location.origin}/auth?token=${invitation.token}&email=${encodeURIComponent(invitation.email)}`);
  };
  
  const filteredInvitations = pendingInvitations.filter(invitation =>
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Invitar Clientes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <InviteClientForm onSuccess={fetchInvitations} />
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Invitaciones pendientes</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchInvitations}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
                
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    placeholder="Buscar por email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Cargando invitaciones...</p>
                ) : filteredInvitations.length > 0 ? (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 bg-white rounded-md border"
                      >
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-500">
                            Enviada: {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expira: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResendInvitation(invitation)}
                        >
                          Reenviar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? "No se encontraron invitaciones que coincidan con la búsqueda"
                      : "No hay invitaciones pendientes"
                    }
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientInvite;
