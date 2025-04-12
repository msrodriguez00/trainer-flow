
import { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  tier: string | null;
};

export type TrainerBrand = {
  id: string;
  trainer_id: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
};

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  trainerBrand: TrainerBrand | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isClient: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (userData: { email: string; password: string; name: string; trainerId?: string }) => Promise<void>;
};
