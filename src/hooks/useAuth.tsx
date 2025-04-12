
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

type TrainerBrand = {
  id: string;
  trainer_id: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  trainerBrand: TrainerBrand | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isClient: boolean;  // Propiedad para verificar si el usuario es cliente
  isTrainer: boolean; // Propiedad para verificar si el usuario es entrenador
  isAdmin: boolean;   // Nueva propiedad para verificar si el usuario es administrador
  signIn: (credentials: { email: string; password: string }) => Promise<void>; // Added back
  signUp: (userData: { email: string; password: string; name: string; trainerId?: string }) => Promise<void>; // Added back
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trainerBrand, setTrainerBrand] = useState<TrainerBrand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log("AuthProvider - Setting up auth state listener");

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
          setTrainerBrand(null);
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
      } else {
        setIsLoading(false);
      }
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
        setIsLoading(false);
        return;
      }

      console.log("Profile fetched:", data);
      setProfile(data);
      
      // If user is a trainer, fetch their brand settings
      if (data.role === 'trainer') {
        fetchTrainerBrand(userId);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      setIsLoading(false);
    }
  };

  const fetchTrainerBrand = async (userId: string) => {
    try {
      console.log("Fetching trainer brand for:", userId);
      const { data, error } = await supabase
        .from("trainer_brands")
        .select("*")
        .eq("trainer_id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error code
        console.error("Error fetching trainer brand:", error);
      } else if (data) {
        console.log("Trainer brand fetched:", data);
        setTrainerBrand(data);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchTrainerBrand:", error);
      setIsLoading(false);
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

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async ({ 
    email, 
    password, 
    name, 
    trainerId 
  }: { 
    email: string; 
    password: string; 
    name: string; 
    trainerId?: string 
  }) => {
    // Register the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      // Update the profile with role and other info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          role: trainerId ? "client" : "trainer",
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // If trainerId exists, create client record
      if (trainerId) {
        const { error: clientError } = await supabase.from("clients").insert({
          name,
          email,
          trainer_id: trainerId,
          user_id: authData.user.id,
        });

        if (clientError) throw clientError;
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Determine if the user is a client or trainer
  const isClient = profile?.role === 'client';
  const isTrainer = profile?.role === 'trainer';

  const value = {
    session,
    user,
    profile,
    trainerBrand,
    isLoading,
    signOut,
    isClient,
    isTrainer,
    isAdmin,
    signIn,
    signUp
  };

  // Add debugging to see if role information is correct
  useEffect(() => {
    if (profile) {
      console.log("Profile updated:", { 
        role: profile.role,
        isClient,
        isTrainer,
        isAdmin
      });
    }
  }, [profile, isClient, isTrainer, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
