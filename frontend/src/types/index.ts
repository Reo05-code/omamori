// 共通の型定義
export type Organization = {
  id: number
  name: string
  created_at?: string
}
// shared types

export type LoginFormProps = {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  error?: string | null;
};
