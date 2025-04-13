
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  error: string;
  showLoginButton?: boolean;
}

export const ErrorMessage = ({ error, showLoginButton = true }: ErrorMessageProps) => {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <p>{error}</p>
      {showLoginButton && window.location.pathname !== "/client-login" && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => window.location.href = '/client-login'}
        >
          Ir a acceso para clientes
        </Button>
      )}
    </div>
  );
};
