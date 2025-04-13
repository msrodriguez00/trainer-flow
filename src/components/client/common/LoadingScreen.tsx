
import { Loader2 } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
