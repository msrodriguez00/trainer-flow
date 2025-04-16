import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useClientIdentification = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log("useClientIdentification hook initialized:", { 
    userId: user?.id,
    userEmail: user?.email,
    hasUser: !!user
  });

  useEffect(() => {
    if (user) {
      fetchClientId();
    } else {
      setClientId(null);
      setLoading(false);
    }
  }, [user]);

  const fetchClientId = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching client ID for user:", user.id);
      const { data, error } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching client ID:", error);
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Client ID found:", data.id);
        setClientId(data.id);
      } else {
        console.log("No client record found for this user");
        console.log("Trying to fetch by email as fallback...");
        
        // Intentar buscar por email como alternativa
        const { data: emailData, error: emailError } = await supabase
          .from("clients")
          .select("id")
          .eq("email", user.email?.toLowerCase())
          .maybeSingle();
          
        if (emailError) {
          console.error("Error fetching client ID by email:", emailError);
        } else if (emailData) {
          console.log("Client ID found by email:", emailData.id);
          setClientId(emailData.id);
        } else {
          console.log("No client record found by email either");
        }
      }
    } catch (error) {
      console.error("Error in fetchClientId:", error);
    } finally {
      setLoading(false);
    }
  };

  return { clientId, loading };
};
