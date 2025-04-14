
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClientIdentification {
  clientId: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<string | null>;
}

export const useClientIdentification = (): ClientIdentification => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClientId = async (): Promise<string | null> => {
    if (!user) {
      setLoading(false);
      return null;
    }

    try {
      console.log("Fetching client ID for user:", user.id);
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client ID:", error);
        setError(error);
        toast({
          title: "Error",
          description: "No se pudo identificar tu perfil de cliente",
          variant: "destructive",
        });
        return null;
      }

      if (data) {
        console.log("Client ID found:", data.id);
        setClientId(data.id);
        return data.id;
      } else {
        console.log("No client record found for this user");
        toast({
          title: "Información",
          description: "No se encontró un perfil de cliente asociado a tu cuenta",
        });
        return null;
      }
    } catch (error: any) {
      console.error("Error in fetchClientId:", error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientId();
  }, [user]);

  useEffect(() => {
    // Reset state when user is not authenticated
    if (!user) {
      setClientId(null);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  return {
    clientId,
    loading,
    error,
    refetch: fetchClientId
  };
};
