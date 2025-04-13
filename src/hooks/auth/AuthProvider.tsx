
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./AuthContext";
import { fetchProfile, fetchTrainerBrand, signIn, signUp, signOut } from "./authService";
import { Profile, TrainerBrand } from "./types";

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
            handleUserAuthenticated(newSession.user.id);
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
        handleUserAuthenticated(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserAuthenticated = async (userId: string) => {
    try {
      await loadUserProfile(userId);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for:", userId);
      const profileData = await fetchProfile(userId);
      
      console.log("Profile fetched:", profileData);
      setProfile(profileData);
      
      // Debug logs para entender el problema
      console.log("Rol del usuario:", profileData.role);
      
      // Verificación explícita para el rol de admin
      const isUserAdmin = profileData.role === 'admin';
      console.log("¿Es admin?:", isUserAdmin);
      
      setIsAdmin(isUserAdmin);
      
      // Si el usuario es un entrenador o administrador, obtener configuración de marca
      if (profileData.role === 'trainer' || profileData.role === 'admin') {
        const brandData = await fetchTrainerBrand(userId);
        console.log("Trainer brand fetched:", brandData);
        setTrainerBrand(brandData);
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
      throw error;
    }
  };

  // Determine if the user is a client or trainer
  const isClient = profile?.role === 'client';
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'; // Admin can also access trainer features

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
