export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  PASSWORD_REQUEST: '/password/request',
  DASHBOARD: '/dashboard',
  WORKER: '/worker',
  dashboardOrganization: (organizationId: number | string) =>
    `/dashboard/organizations/${organizationId}`,
} as const;
