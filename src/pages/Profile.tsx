
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HexColorPicker } from "@/components/ui/color-picker";
import { Upload, Palette, Check } from "lucide-react";

const Profile = () => {
  const { user, profile, isLoading, isTrainer } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Brand customization states
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#9b87f5");
  const [secondaryColor, setSecondaryColor] = useState("#E5DEFF");
  const [accentColor, setAccentColor] = useState("#7E69AB");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
      
      // Load brand settings if trainer
      if (isTrainer && profile.brand_settings) {
        try {
          const brandSettings = JSON.parse(profile.brand_settings);
          setLogoUrl(brandSettings.logoUrl || "");
          setPrimaryColor(brandSettings.primaryColor || "#9b87f5");
          setSecondaryColor(brandSettings.secondaryColor || "#E5DEFF");
          setAccentColor(brandSettings.accentColor || "#7E69AB");
        } catch (error) {
          console.error("Error parsing brand settings:", error);
        }
      }
    }
  }, [user, profile, isLoading, navigate, isTrainer]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setUpdating(true);
    try {
      const updateData: any = {
        name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      // Add brand settings for trainers
      if (isTrainer) {
        updateData.brand_settings = JSON.stringify({
          logoUrl,
          primaryColor,
          secondaryColor,
          accentColor
        });
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tu información se ha actualizado correctamente.",
      });
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

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/logos/${Math.random()}.${fileExt}`;

    setUploadingLogo(true);

    try {
      // Upload the logo
      const { error: uploadError } = await supabase.storage
        .from('trainer-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('trainer-assets')
        .getPublicUrl(filePath);

      setLogoUrl(data.publicUrl);

      toast({
        title: "Logo subido",
        description: "Tu logo se ha subido correctamente.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir el logo",
        description: error.message || "Ha ocurrido un error al subir tu logo.",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const getTrainerTierBadge = () => {
    if (!isTrainer || !profile?.tier) return null;
    
    const tierVariant = {
      'base': 'default',
      'light': 'secondary',
      'pro': 'destructive'
    }[profile.tier] as 'default' | 'secondary' | 'destructive';
    
    return (
      <Badge variant={tierVariant} className="ml-2">
        {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            {isTrainer && (
              <TabsTrigger value="branding">Personalización de Marca</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="personal">
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
                      value={user?.email || ""}
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
                        value={profile?.tier?.charAt(0).toUpperCase() + (profile?.tier?.slice(1) || 'Base')}
                        disabled
                      />
                      <p className="text-sm text-gray-500">
                        Solo los administradores pueden cambiar tu nivel de entrenador.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL de Avatar</Label>
                    <Input
                      id="avatar"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://ejemplo.com/avatar.jpg"
                    />
                    {avatarUrl && (
                      <div className="mt-2 flex items-center">
                        <img
                          src={avatarUrl}
                          alt="Avatar preview"
                          className="w-12 h-12 rounded-full object-cover mr-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/150";
                          }}
                        />
                        <span className="text-sm text-gray-500">Vista previa del avatar</span>
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={updating}>
                    {updating ? "Actualizando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {isTrainer && (
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Personalización de Marca</CardTitle>
                  <p className="text-sm text-gray-500">
                    Personaliza la imagen de tu marca con colores y logo
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Logo</h3>
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-white flex items-center justify-center">
                            <img
                              src={logoUrl}
                              alt="Logo de la marca"
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/150?text=Logo";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 border rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">Sin logo</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Upload size={16} />
                              <span>Subir nuevo logo</span>
                            </div>
                            <Input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleUploadLogo}
                              className="hidden"
                              disabled={uploadingLogo}
                            />
                          </Label>
                          {uploadingLogo && <p className="text-sm text-gray-500">Subiendo...</p>}
                          <p className="text-xs text-gray-500">
                            Formatos recomendados: PNG, JPG. Tamaño máximo: 5MB
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Palette size={18} />
                        <span>Paleta de Colores</span>
                      </h3>
                      
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="primaryColor">Color Primario</Label>
                          <div className="flex flex-col gap-2">
                            <div className="w-full h-24 rounded-md border overflow-hidden">
                              <HexColorPicker
                                color={primaryColor}
                                onChange={setPrimaryColor}
                                className="w-full"
                              />
                            </div>
                            <Input
                              id="primaryColor"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="font-mono"
                            />
                            <div 
                              className="w-full h-10 rounded-md" 
                              style={{ backgroundColor: primaryColor }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="secondaryColor">Color Secundario</Label>
                          <div className="flex flex-col gap-2">
                            <div className="w-full h-24 rounded-md border overflow-hidden">
                              <HexColorPicker
                                color={secondaryColor}
                                onChange={setSecondaryColor}
                                className="w-full"
                              />
                            </div>
                            <Input
                              id="secondaryColor"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="font-mono"
                            />
                            <div 
                              className="w-full h-10 rounded-md" 
                              style={{ backgroundColor: secondaryColor }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="accentColor">Color de Acento</Label>
                          <div className="flex flex-col gap-2">
                            <div className="w-full h-24 rounded-md border overflow-hidden">
                              <HexColorPicker
                                color={accentColor}
                                onChange={setAccentColor}
                                className="w-full"
                              />
                            </div>
                            <Input
                              id="accentColor"
                              value={accentColor}
                              onChange={(e) => setAccentColor(e.target.value)}
                              className="font-mono"
                            />
                            <div 
                              className="w-full h-10 rounded-md" 
                              style={{ backgroundColor: accentColor }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-base font-medium mb-2">Previsualización</h4>
                        <div className="p-4 rounded-lg border" style={{ backgroundColor: secondaryColor }}>
                          <div 
                            className="w-full p-3 rounded-md text-white flex items-center justify-between mb-3"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <span>Encabezado</span>
                            {logoUrl && (
                              <img 
                                src={logoUrl} 
                                alt="Logo preview" 
                                className="h-8 w-auto"
                              />
                            )}
                          </div>
                          <div className="bg-white p-4 rounded-md">
                            <p className="text-gray-800 mb-3">Contenido de ejemplo</p>
                            <Button 
                              style={{ backgroundColor: accentColor }}
                              className="text-white"
                            >
                              <Check size={16} className="mr-2" /> Botón de acción
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={updating} className="mt-4">
                      {updating ? "Guardando..." : "Guardar configuración de marca"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
