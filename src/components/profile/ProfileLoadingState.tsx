
import { Loader2 } from "lucide-react";

const ProfileLoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Cargando...</p>
    </div>
  );
};

export default ProfileLoadingState;
