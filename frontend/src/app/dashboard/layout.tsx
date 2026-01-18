import React from 'react';
import LayoutShell from './_components/LayoutShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutShell>{children}</LayoutShell>;
}
