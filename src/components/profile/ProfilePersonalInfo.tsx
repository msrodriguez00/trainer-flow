
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2 } from "lucide-react";

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatars/${Date.now()}.${fileExt}`;

    setUploadingAvatar(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", userId);

      if (profileError) throw profileError;

      setAvatarUrl(publicUrlData.publicUrl);

      toast({
        title: "Avatar actualizado",
        description: "Tu avatar se ha subido correctamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir el avatar",
        description: error.message || "Ha ocurrido un error al subir tu avatar.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getTrainerTierBadge = () => {
    if (!isTrainer || !trainerTier) return null;
    
    const tierVariant = {
      'base': 'default',
      'light': 'secondary',
      'pro': 'destructive'
    }[trainerTier] as 'default' | 'secondary' | 'destructive';
    
    return (
      <Badge variant={tierVariant} className="ml-2">
        {trainerTier.charAt(0).toUpperCase() + trainerTier.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <CardTitle>Información Personal</CardTitle>
          {isTrainer && getTrainerTierBadge()}
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
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Subir Avatar</Label>
            <div className="flex items-center gap-4">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover mr-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/150";
                  }}
                />
              )}
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Upload size={16} />
                    <span>Subir nuevo avatar</span>
                  </div>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </Label>
                {uploadingAvatar && <p className="text-sm text-gray-500">Subiendo...</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Formatos recomendados: PNG, JPG. Tamaño máximo: 5MB
                </p>
              </div>
            </div>
          </div>
          
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
