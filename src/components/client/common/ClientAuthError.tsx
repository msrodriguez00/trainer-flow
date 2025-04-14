
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, LogIn } from "lucide-react";

interface ClientAuthErrorProps {
  message?: string;
  showLoginButton?: boolean;
}

const ClientAuthError: React.FC<ClientAuthErrorProps> = ({ 
  message = "Se requiere autenticación para acceder a esta funcionalidad", 
  showLoginButton = true 
}) => {
  const navigate = useNavigate();
  
  return (
    <Card className="shadow-md max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <Shield className="mr-2 h-5 w-5" />
          Acceso Requerido
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="mb-2">{message}</p>
        <p className="text-sm text-gray-500">
          Debes iniciar sesión como cliente para acceder a esta sección.
        </p>
      </CardContent>
      {showLoginButton && (
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/client-login")} className="flex items-center">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ClientAuthError;
