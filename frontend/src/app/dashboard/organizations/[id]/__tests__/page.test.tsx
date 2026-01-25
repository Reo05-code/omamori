import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';

import { fetchMemberships } from '@/lib/api/memberships';
import { fetchOrganizationAlertsSummary } from '@/lib/api/alerts';
import { DASHBOARD } from '@/constants/ui-messages';
import OrganizationDashboard from '../page';

jest.mock('@/lib/api/memberships', () => ({
  fetchMemberships: jest.fn(),
}));

jest.mock('@/lib/api/alerts', () => ({
  fetchOrganizationAlertsSummary: jest.fn(),
  fetchOrganizationAlerts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(() => ({
    user: {
      id: 1,
      email: 'admin@example.com',
      memberships: [{ id: 1, organization_id: 1, role: 'admin' }],
    },
    loading: false,
    isAuthenticated: true,
  })),
}));

describe('OrganizationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as unknown as jest.Mock).mockReturnValue({ id: '1' });
  });

  it('稼働中メンバー人数を表示し、カード押下でメンバー一覧へ遷移できる', async () => {
    (fetchMemberships as jest.Mock).mockResolvedValueOnce([
      { id: 1, user_id: 1, role: 'worker', working: true },
      { id: 2, user_id: 2, role: 'worker', working: false },
      { id: 3, user_id: 3, role: 'worker', active_work_session: { active: true, id: 10 } },
    ]);
    (fetchOrganizationAlertsSummary as jest.Mock).mockResolvedValueOnce({
      counts: {
        unresolved: 15,
        open: 10,
        in_progress: 5,
        urgent_open: 8,
      },
      breakdown: {
        urgent: {
          sos_open: 3,
          critical_open_non_sos: 5,
        },
      },
    });

    render(<OrganizationDashboard />);

    // カードのリンクを探す
    const cardLink = await screen.findByRole('link', {
      name: new RegExp(`${DASHBOARD.CARDS.ACTIVE_WORKERS.TITLE}`),
    });
    expect(cardLink).toHaveAttribute('href', '/dashboard/organizations/1/members');

    // 稼働中人数（2人）が表示される
    await screen.findByText('2');
  });

  it('未対応アラートカードを表示し、アラート一覧へ遷移できる', async () => {
    (fetchMemberships as jest.Mock).mockResolvedValueOnce([]);
    (fetchOrganizationAlertsSummary as jest.Mock).mockResolvedValueOnce({
      counts: {
        unresolved: 15,
        open: 10,
        in_progress: 5,
        urgent_open: 8,
      },
      breakdown: {
        urgent: {
          sos_open: 3,
          critical_open_non_sos: 5,
        },
      },
    });

    render(<OrganizationDashboard />);

    // 未対応アラートカード
    const unresolvedCard = await screen.findByRole('link', { name: /未対応アラート/ });
    expect(unresolvedCard).toHaveAttribute(
      'href',
      '/dashboard/organizations/1/alerts?status=open,in_progress',
    );
    await screen.findByText('15');
    await screen.findByText('10件 未対応');
  });

  it('緊急対応カードを表示し、urgent付きでアラート一覧へ遷移できる', async () => {
    (fetchMemberships as jest.Mock).mockResolvedValueOnce([]);
    (fetchOrganizationAlertsSummary as jest.Mock).mockResolvedValueOnce({
      counts: {
        unresolved: 15,
        open: 10,
        in_progress: 5,
        urgent_open: 8,
      },
      breakdown: {
        urgent: {
          sos_open: 3,
          critical_open_non_sos: 5,
        },
      },
    });

    render(<OrganizationDashboard />);

    // 緊急対応カード
    const urgentCard = await screen.findByRole('link', { name: /緊急対応/ });
    expect(urgentCard).toHaveAttribute(
      'href',
      '/dashboard/organizations/1/alerts?status=open&urgent=true',
    );
    await screen.findByText('8');
    await screen.findByText('SOS: 3件 / Critical: 5件');
  });

  it('アラート集計API失敗時は0を表示する', async () => {
    (fetchMemberships as jest.Mock).mockResolvedValueOnce([]);
    (fetchOrganizationAlertsSummary as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<OrganizationDashboard />);

    // エラー時でもカードは表示され、値は0
    await screen.findByText('未対応アラート');
    await screen.findByText('緊急対応');
  });
});
