
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({ error, onRetry }: ErrorMessageProps) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p>{error}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCcw className="mr-2 h-3 w-3" />
              Reintentar
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
