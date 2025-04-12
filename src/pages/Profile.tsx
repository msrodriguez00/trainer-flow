
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import ProfilePersonalInfo from "@/components/profile/ProfilePersonalInfo";
import BrandingSettings from "@/components/profile/BrandingSettings";
import ProfileLoadingState from "@/components/profile/ProfileLoadingState";

const Profile = () => {
  const { user, profile, trainerBrand, isLoading, isTrainer } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleProfileUpdate = () => {
    // Forzar recarga de datos
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (isLoading) {
    return <ProfileLoadingState />;
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
            <ProfilePersonalInfo
              userId={user?.id || ""}
              userEmail={user?.email}
              initialName={profile?.name || ""}
              initialAvatarUrl={profile?.avatar_url || ""}
              isTrainer={isTrainer}
              trainerTier={profile?.tier}
              onUpdate={handleProfileUpdate}
            />
          </TabsContent>
          
          {isTrainer && (
            <TabsContent value="branding">
              <BrandingSettings
                userId={user?.id || ""}
                initialLogoUrl={trainerBrand?.logo_url || ""}
                initialPrimaryColor={trainerBrand?.primary_color || "#9b87f5"}
                initialSecondaryColor={trainerBrand?.secondary_color || "#E5DEFF"}
                initialAccentColor={trainerBrand?.accent_color || "#7E69AB"}
                onUpdate={handleProfileUpdate}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
