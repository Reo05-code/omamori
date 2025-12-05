"use client"

import React, { createContext, useContext } from "react"
import { useAuth } from "../hooks/useAuth"

// `useAuth` の戻り型をそのまま Context の型として利用
type AuthContextType = ReturnType<typeof useAuth>

// Context の初期値は null。Provider 内で必ず値を提供する設計。
const AuthContext = createContext<AuthContextType | null>(null)

/**
 * AuthProvider
 * - `useAuth` を呼び出して認証状態（isAuthenticated / token / login / logout など）を取得する
 * - 取得したオブジェクトを Context 経由で子コンポーネントに渡す
 * - このコンポーネントはクライアント専用 (`"use client"`) なので SSR コンポーネントには使えない
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * useAuthContext
 * - Context を安全に取り出すためのカスタムフック
 * - Provider の外で呼ばれた場合は明確なエラーを投げる
 */
export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
}

export default AuthProvider
