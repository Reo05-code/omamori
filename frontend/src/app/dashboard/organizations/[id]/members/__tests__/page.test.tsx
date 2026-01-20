import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MembersPage from '../page';
import { fetchMemberships } from '@/lib/api/memberships';
import { useParams } from 'next/navigation';

jest.mock('@/lib/api/memberships', () => ({
  fetchMemberships: jest.fn(),
}));

describe('MembersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as unknown as jest.Mock).mockReturnValue({ id: '1' });
  });

  it('初回ロード時はローディング表示される', () => {
    (fetchMemberships as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<MembersPage />);

    expect(screen.getByText('読み込み中です...')).toBeInTheDocument();
  });

  it('active_work_session に応じて「稼働中/停止」を表示する', async () => {
    (fetchMemberships as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        user_id: 10,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: true, id: 99 },
      },
      {
        id: 2,
        user_id: 11,
        email: 'worker2@example.com',
        role: 'worker',
        active_work_session: { active: false, id: null },
      },
    ]);

    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中です...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('見守り中')).toBeInTheDocument();
    expect(screen.getByText('待機中')).toBeInTheDocument();
  });

  it('API失敗時はエラーが表示される', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fetchMemberships as jest.Mock).mockRejectedValueOnce(new Error('500 Internal Server Error'));

    render(<MembersPage />);

    await screen.findByText('読み込みに失敗しました。時間をおいて再度お試しください。');
    expect(screen.queryByText('500 Internal Server Error')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
