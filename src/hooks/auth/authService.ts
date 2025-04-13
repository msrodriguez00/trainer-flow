
import { supabase } from "@/integrations/supabase/client";

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }

  return data;
};

export const fetchTrainerBrand = async (userId: string) => {
  const { data, error } = await supabase
    .from("trainer_brands")
    .select("*")
    .eq("trainer_id", userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching trainer brand:", error);
    throw error;
  }

  return data || null;
};

// Changed: removing checkIfAdmin as we'll use role from profile instead

export const signIn = async ({ email, password }: { email: string; password: string }) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signUp = async ({ 
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

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
