
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import TrainerBadge from "./TrainerBadge";
import AvatarUploader from "./AvatarUploader";

type ProfilePersonalInfoProps = {
  userId: string;
  userEmail: string | undefined;
  initialName: string;
  initialAvatarUrl: string;
  isTrainer: boolean;
  trainerTier?: string | null;
  onUpdate: () => void;
};

const ProfilePersonalInfo = ({
  userId,
  userEmail,
  initialName,
  initialAvatarUrl,
  isTrainer,
  trainerTier,
  onUpdate
}: ProfilePersonalInfoProps) => {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    setUpdating(true);
    try {
      console.log("Actualizando perfil para:", userId);
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error al actualizar perfil:", profileError);
        throw new Error(`Error al actualizar perfil: ${profileError.message}`);
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información personal se ha actualizado correctamente.",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "Ha ocurrido un error al actualizar tu perfil.",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <CardTitle>Información Personal</CardTitle>
          <TrainerBadge isTrainer={isTrainer} trainerTier={trainerTier} />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={userEmail || ""}
              disabled
            />
            <p className="text-sm text-gray-500">
              El correo electrónico no se puede cambiar.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          {isTrainer && (
            <div className="space-y-2">
              <Label htmlFor="tier">Nivel de entrenador</Label>
              <Input
                id="tier"
                type="text"
                value={trainerTier?.charAt(0).toUpperCase() + (trainerTier?.slice(1) || 'Base')}
                disabled
              />
              <p className="text-sm text-gray-500">
                Solo los administradores pueden cambiar tu nivel de entrenador.
              </p>
            </div>
          )}
          
          <AvatarUploader 
            userId={userId} 
            avatarUrl={avatarUrl} 
            onAvatarChange={setAvatarUrl} 
          />
          
          <Button type="submit" disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : "Guardar Cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfilePersonalInfo;
