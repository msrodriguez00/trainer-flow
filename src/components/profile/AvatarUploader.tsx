
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";

type AvatarUploaderProps = {
  userId: string;
  avatarUrl: string;
  onAvatarChange: (newUrl: string) => void;
};

const AvatarUploader = ({ userId, avatarUrl, onAvatarChange }: AvatarUploaderProps) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    setUploadingAvatar(true);

    try {
      console.log("Starting avatar upload to bucket 'avatars'");
      
      // Upload file to avatars bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful, getting public URL");

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL for the uploaded avatar");
      }

      console.log("Public URL obtained:", publicUrlData.publicUrl);

      // Update user profile with new avatar URL
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      // Update local state
      onAvatarChange(publicUrlData.publicUrl);

      toast({
        title: "Avatar actualizado",
        description: "Tu avatar se ha subido correctamente.",
      });
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast({
        variant: "destructive",
        title: "Error al subir el avatar",
        description: error.message || "Ha ocurrido un error al subir tu avatar.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
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
          {uploadingAvatar && (
            <div className="flex items-center text-sm text-gray-500 mt-2">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Subiendo...</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Formatos recomendados: PNG, JPG. Tamaño máximo: 5MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploader;
