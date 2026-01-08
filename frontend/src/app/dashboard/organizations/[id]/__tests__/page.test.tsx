import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams } from 'next/navigation';

import { fetchMemberships } from '@/lib/api/memberships';
import OrganizationDashboard from '../page';

jest.mock('@/lib/api/memberships', () => ({
  fetchMemberships: jest.fn(),
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

    render(<OrganizationDashboard />);

    // カードのリンクを探す
    const cardLink = await screen.findByRole('link', { name: /稼働中メンバー/ });
    expect(cardLink).toHaveAttribute('href', '/dashboard/organizations/1/members');

    // 稼働中人数（2人）が表示される
    await screen.findByText('2');
  });
});
