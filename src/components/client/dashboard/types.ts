
export interface Trainer {
  id: string;
  name: string;
  branding?: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    logo_url: string | null;
  };
}

export interface TrainerBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
}
