export const USER_ROLES = {
  ADMIN: 'admin',
  WORKER: 'worker',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
