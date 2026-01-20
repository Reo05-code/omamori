import type { UserResponse } from '../../src/lib/api/types';

export const MOCK_ORG_ID = 1;
export const MOCK_WORKER_ID = 10;
export const MOCK_SESSION_ID = 123;

type UserCore = Pick<UserResponse, 'id' | 'email' | 'name'>;
type UserOverrides = UserCore & Omit<Partial<UserResponse>, keyof UserCore>;

function buildUser({ id, email, name, ...rest }: UserOverrides): UserResponse {
  return {
    id,
    email,
    provider: 'email',
    uid: String(id),
    name,
    phone_number: '0000000000',
    avatar_url: null,
    allow_password_change: false,
    memberships: [],
    settings: {},
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ...rest,
  };
}

export const MOCK_ADMIN = buildUser({
  id: 1,
  email: 'admin@example.com',
  name: 'Admin',
  memberships: [{ id: 1, organization_id: MOCK_ORG_ID, role: 'admin' }],
});

export const MOCK_WORKER = buildUser({
  id: MOCK_WORKER_ID,
  email: 'worker@example.com',
  name: 'Worker',
  memberships: [{ id: 2, organization_id: MOCK_ORG_ID, role: 'worker' }],
});
