import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import InviteClientForm from "@/components/InviteClientForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Mail, Clock, Check, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

interface Invitation {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: InvitationStatus;
}

const ClientInvite = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Process invitations to check for expired ones
      const processedInvitations = (data || []).map((inv: any) => {
        const expiryDate = new Date(inv.expires_at);
        // If status is pending but invitation is expired, mark it as expired
        if (inv.status === 'pending' && expiryDate < new Date()) {
          return { ...inv, status: 'expired' as InvitationStatus };
        }
        return inv;
      });

      setInvitations(processedInvitations);
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
  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const handleResendInvitation = async (invitation: Invitation) => {
    toast({
      title: "Invitación reenviada",
      description: `Se ha reenviado la invitación a ${invitation.email}.`,
    });
    
    console.log(`Reenvío de invitación a ${invitation.email}`);
  };

  const handleDeleteInvitation = async () => {
    if (!selectedInvitation) return;
    
    try {
      const { error } = await supabase
        .from("client_invitations")
        .delete()
        .eq("id", selectedInvitation.id);

      if (error) throw error;

      setInvitations((prev) => prev.filter((inv) => inv.id !== selectedInvitation.id));
      
      toast({
        title: "Invitación cancelada",
        description: `Se ha eliminado la invitación para ${selectedInvitation.email}.`,
      });
      
      setShowDeleteDialog(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la invitación.",
        variant: "destructive",
      });
    }
  };
  
  const getInvitationStatus = (invitation: Invitation): InvitationStatus => {
    // If the status is already computed (like for expired invitations), return it
    if (invitation.status === 'expired') {
      return 'expired';
    }
    
    return invitation.status as InvitationStatus;
  };
  
  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Mail className="h-3 w-3" /> Pendiente
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Expirado
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" /> Aceptado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <X className="h-3 w-3" /> Rechazado
          </Badge>
        );
    }
  };
  
  const filteredInvitations = invitations.filter(invitation =>
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Invitaciones a Clientes</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <InviteClientForm onSuccess={fetchInvitations} />
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Invitaciones</h3>
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
                    {filteredInvitations.map((invitation) => {
                      const status = getInvitationStatus(invitation);
                      
                      return (
                        <div
                          key={invitation.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-md border gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{invitation.email}</p>
                              {getStatusBadge(status)}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-sm text-gray-500">
                              <p>
                                Enviada: {new Date(invitation.created_at).toLocaleDateString()}
                              </p>
                              <p>
                                {status === "expired" ? (
                                  <span className="text-amber-600">Expirada: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                                ) : (
                                  <span>Expira: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 sm:flex-shrink-0">
                            {(status === "pending" || status === "expired") && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleResendInvitation(invitation)}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Reenviar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedInvitation(invitation);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar invitación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar la invitación enviada a {selectedInvitation?.email}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvitation}>
              Sí, eliminar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientInvite;
