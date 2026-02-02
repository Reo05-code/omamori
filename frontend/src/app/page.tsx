'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { APP_ROUTES } from '@/constants/routes';
import { USER_ROLES } from '@/constants/roles';
import Spinner from '../components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }

    const memberships = user.memberships ?? [];
    const adminMembership = memberships.find((membership) => membership.role === USER_ROLES.ADMIN);

    if (adminMembership) {
      const organizationId = adminMembership.organization_id;
      router.replace(
        organizationId ? APP_ROUTES.dashboardOrganization(organizationId) : APP_ROUTES.DASHBOARD,
      );
      return;
    }

    const hasOnlyWorkerRole =
      memberships.length > 0 &&
      memberships.every((membership) => membership.role === USER_ROLES.WORKER);

    if (hasOnlyWorkerRole) {
      router.replace(APP_ROUTES.WORKER);
      return;
    }

    router.replace(APP_ROUTES.DASHBOARD);
  }, [isAuthenticated, user, loading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-bg to-warm-brown-100">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-warm-brown-700 text-sm">リダイレクト中...</p>
      </div>
    </main>
  );
}
