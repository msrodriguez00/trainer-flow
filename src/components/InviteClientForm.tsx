
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
      // Check if client already exists
      const { data: existingClients } = await supabase
        .from("clients")
        .select("*")
        .eq("email", email);

      // Generate invitation token
      const token = uuidv4();
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7); // Expires in 7 days

      // Create invitation record
      const { error: inviteError } = await supabase
        .from("client_invitations")
        .insert({
          email,
          trainer_id: user.id,
          token,
          expires_at: expires_at.toISOString()
        });

      if (inviteError) {
        if (inviteError.code === "23505") { // Unique violation
          throw new Error("Ya has invitado a este cliente anteriormente.");
        }
        throw inviteError;
      }

      // If client exists, add trainer to their trainers list
      if (existingClients && existingClients.length > 0) {
        const client = existingClients[0];
        
        // Add current trainer to client's trainers array if not already there
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
          description: "Este cliente ya existe en el sistema. Se le ha enviado un link para conectarse contigo.",
        });
      } else {
        toast({
          title: "Invitación enviada",
          description: `Se ha enviado una invitación a ${email} para unirse como tu cliente.`,
        });
      }

      // In a real-world app, we would send an email here with the invitation link
      console.log(`Invitation link: ${window.location.origin}/auth?token=${token}&email=${encodeURIComponent(email)}`);
      
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
