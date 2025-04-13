import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ColorPicker, ColorInput } from "@/components/ui/color-picker";
import { Upload, Palette, Check, Loader2 } from "lucide-react";

type BrandingSettingsProps = {
  userId: string;
  initialLogoUrl: string;
  initialPrimaryColor: string;
  initialSecondaryColor: string;
  initialAccentColor: string;
  onUpdate: () => void;
};

const BrandingSettings = ({
  userId,
  initialLogoUrl,
  initialPrimaryColor,
  initialSecondaryColor,
  initialAccentColor,
  onUpdate
}: BrandingSettingsProps) => {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [updating, setUpdating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const { toast } = useToast();

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    setUpdating(true);
    try {
      console.log("Actualizando marca para:", userId);
      
      const brandData = {
        trainer_id: userId,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        updated_at: new Date().toISOString(),
      };

      const { data: existingBrand, error: checkError } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", userId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error al verificar marca existente:", checkError);
        throw new Error(`Error al verificar marca existente: ${checkError.message}`);
      }

      if (existingBrand) {
        const { error: brandError } = await supabase
          .from("trainer_brands")
          .update(brandData)
          .eq("trainer_id", userId);

        if (brandError) {
          console.error("Error al actualizar marca:", brandError);
          throw new Error(`Error al actualizar marca: ${brandError.message}`);
        }
      } else {
        const { error: brandError } = await supabase
          .from("trainer_brands")
          .insert(brandData);

        if (brandError) {
          console.error("Error al crear marca:", brandError);
          throw new Error(`Error al crear marca: ${brandError.message}`);
        }
      }

      toast({
        title: "Marca actualizada",
        description: "La configuración de tu marca se ha actualizado correctamente.",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar marca",
        description: error.message || "Ha ocurrido un error al actualizar la configuración de tu marca.",
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
    const fileName = `${userId}/logos/${Date.now()}.${fileExt}`;

    setUploadingLogo(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('trainer-assets')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('trainer-assets')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrlData.publicUrl);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalización de Marca</CardTitle>
        <p className="text-sm text-gray-500">
          Personaliza la imagen de tu marca con colores y logo
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateBranding} className="space-y-6">
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
                    <ColorPicker
                      color={primaryColor}
                      onChange={setPrimaryColor}
                      className="w-full"
                    />
                  </div>
                  <ColorInput
                    id="primaryColor"
                    color={primaryColor}
                    onChange={setPrimaryColor}
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
                    <ColorPicker
                      color={secondaryColor}
                      onChange={setSecondaryColor}
                      className="w-full"
                    />
                  </div>
                  <ColorInput
                    id="secondaryColor"
                    color={secondaryColor}
                    onChange={setSecondaryColor}
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
                    <ColorPicker
                      color={accentColor}
                      onChange={setAccentColor}
                      className="w-full"
                    />
                  </div>
                  <ColorInput
                    id="accentColor"
                    color={accentColor}
                    onChange={setAccentColor}
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
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : "Guardar configuración de marca"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BrandingSettings;
