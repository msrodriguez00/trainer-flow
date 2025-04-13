
export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  isAdmin: boolean;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  trainers: string[] | null;
};

export type Trainer = {
  id: string;
  name: string;
};

export interface UserFormValues {
  email: string;
  name: string;
  password?: string;
  role?: string;
  isAdmin: boolean;
}
