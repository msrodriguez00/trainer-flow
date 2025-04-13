
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface InviteClientFormProps {
  onSuccess?: () => void;
}

const InviteClientForm = ({ onSuccess }: InviteClientFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Verificar si el cliente ya existe
      const { data: existingClients } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email);

      // Generar token de invitación
      const token = uuidv4();
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7); // Expira en 7 días

      // Crear registro de invitación
      const { error: inviteError } = await supabase
        .from("client_invitations")
        .insert({
          email,
          trainer_id: user.id,
          token,
          expires_at: expires_at.toISOString()
        });

      // Solo mostrar error si no es una violación de unicidad (podemos reinvitar)
      if (inviteError && inviteError.code !== "23505") {
        throw inviteError;
      }

      // Si el cliente existe, añadir entrenador a su lista de entrenadores
      if (existingClients && existingClients.length > 0) {
        const client = existingClients[0];
        
        // Añadir entrenador actual a la matriz de entrenadores del cliente si aún no está
        const updatedTrainers = [...(client.trainers || [])];
        if (!updatedTrainers.includes(user.id)) {
          updatedTrainers.push(user.id);
          
          await supabase
            .from("clients")
            .update({ trainers: updatedTrainers })
            .eq("id", client.id);
        }
        
        toast({
          title: "Cliente ya registrado",
          description: "Este cliente ya existe en el sistema. Se le ha enviado un nuevo link para conectarse contigo.",
        });
      } else {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${email} para unirse como tu cliente.`,
        });
      }

      // En una aplicación real, enviaríamos un correo con el enlace de invitación
      console.log(`Enlace de invitación: ${window.location.origin}/auth?token=${token}&email=${encodeURIComponent(email)}`);
      
      setEmail("");
      if (onSuccess) onSuccess();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al enviar invitación",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitar nuevo cliente</CardTitle>
      </CardHeader>
      <form onSubmit={handleInviteClient}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Se enviará un correo con un enlace de invitación al cliente.
              Si el cliente ya existe en el sistema, se le asociará a tu cuenta como entrenador.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar invitación"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default InviteClientForm;
