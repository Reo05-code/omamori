import React from 'react';
import LayoutShell from './_components/LayoutShell';
import DashboardAuthGuard from './_components/DashboardAuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <LayoutShell>{children}</LayoutShell>
    </DashboardAuthGuard>
  );
}
