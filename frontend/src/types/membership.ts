export interface Membership {
  id: number;
  user_id: number;
  email?: string | null;
  role: string;
}

export interface User {
  id: number;
  name?: string | null;
  email?: string | null;
}
