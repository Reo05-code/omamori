// 共通の型定義
export type Organization = {
  id: number;
  name: string;
  created_at?: string;
};
// shared types

export type LoginFormProps = {
  onSubmit: (email: string, password: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
};
