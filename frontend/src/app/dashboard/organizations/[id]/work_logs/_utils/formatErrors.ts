import { ApiError } from '@/lib/api/client';

type ApiErrorMessages = {
  forbidden: string;
  notFound: string;
  network: string;
  default: string;
};

// 呼び出し側で文言（画面/コンテキスト）を差し替えられるよう、
// ApiError判定だけ共通化するユーティリティ。
export function formatApiErrorMessage(error: unknown, messages: ApiErrorMessages): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return messages.forbidden;
    if (error.status === 404) return messages.notFound;
    // fetch失敗などで status=0 が返る実装に合わせ、ネットワーク系を明示
    if (error.status === 0) return messages.network;
  }

  return messages.default;
}
