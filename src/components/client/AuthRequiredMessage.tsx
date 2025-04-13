
import { UserPlus, AlertCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

export const AuthRequiredMessage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Invitaciones de Entrenadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-4 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
          <p className="font-medium">Por favor inicia sesión como cliente</p>
          <p className="text-sm text-gray-500 mt-1">
            Para ver invitaciones, usa la página de <a href="/client-login" className="text-blue-500 hover:underline">acceso para clientes</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
