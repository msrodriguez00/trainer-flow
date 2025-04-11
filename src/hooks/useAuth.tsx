
import { useState, useEffect, createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  tier: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isClient: boolean;  // Propiedad para verificar si el usuario es cliente
  isTrainer: boolean; // Propiedad para verificar si el usuario es entrenador
  isAdmin: boolean;   // Nueva propiedad para verificar si el usuario es administrador
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer Supabase calls with setTimeout
        if (newSession?.user) {
          setTimeout(() => {
            fetchProfile(newSession.user.id);
            checkIfAdmin(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Checking for existing session:", currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
        checkIfAdmin(currentSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      console.log("Profile fetched:", data);
      setProfile(data);
    } catch (error) {
      console.error("Error in fetchProfile:", error);
    }
  };

  const checkIfAdmin = async (userId: string) => {
    try {
      console.log("Checking admin status for:", userId);
      // Use the new check_if_admin function instead of is_admin
      const { data, error } = await supabase.rpc('check_if_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin status:", error);
        return;
      }
      
      console.log("Admin status:", data);
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error in checkIfAdmin:", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  // Determinar si el usuario es cliente o entrenador
  const isClient = profile?.role === 'client';
  const isTrainer = profile?.role === 'trainer';

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    isClient,
    isTrainer,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
