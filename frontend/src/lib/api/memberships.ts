// 指定した組織のメンバー一覧を取得するAPI クライアント関数
import type { Membership } from "../api/types"
import { api } from "./client"
import { API_PATHS } from "./paths"

export async function fetchMemberships(organizationId: string): Promise<Membership[]> {
  const path = API_PATHS.ORGANIZATIONS.MEMBERSHIPS(organizationId)

  const res = await api.get<Membership[]>(path)

  if (res.error || res.data === null) {
    throw new Error(res.error || `failed to fetch memberships: status=${res.status}`)
  }

  return res.data
}
