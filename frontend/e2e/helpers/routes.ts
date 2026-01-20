export function getDashboardUrl() {
  return '/dashboard';
}

export function getMembersUrl(orgId: number) {
  return `/dashboard/organizations/${orgId}/members`;
}

export function getWorkLogsUrl(orgId: number, userId: number, tab?: string) {
  const url = new URL(`/dashboard/organizations/${orgId}/work_logs`, 'http://example.test');
  url.searchParams.set('userId', String(userId));

  if (tab) {
    url.searchParams.set('tab', tab);
  }

  return `${url.pathname}${url.search}`;
}

export function getAlertsUrl(orgId: number) {
  return `/dashboard/organizations/${orgId}/alerts`;
}
