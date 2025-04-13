
import { Loader2 } from "lucide-react";

export const LoadingInvitations = () => {
  return (
    <div className="flex justify-center py-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
};
