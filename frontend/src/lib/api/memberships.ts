import type { Membership } from "../../types/membership"

export async function fetchMemberships(organizationId: string): Promise<Membership[]> {
  const res = await fetch(`/api/v1/organizations/${organizationId}/memberships`, {
    credentials: "include",
    headers: {
      "Accept": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`failed to fetch memberships: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data as Membership[]
}
