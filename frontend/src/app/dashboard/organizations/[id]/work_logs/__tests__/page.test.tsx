import '@testing-library/jest-dom';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import WorkLogsPage from '../page';
import { fetchSafetyLogs } from '@/lib/api/safety_logs';
import { fetchMemberships } from '@/lib/api/memberships';
import { fetchRiskAssessmentsWithMeta } from '@/lib/api/risk_assessments';
import { ApiError } from '@/lib/api/client';
import { useParams, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api/safety_logs', () => ({
  fetchSafetyLogs: jest.fn(),
}));

jest.mock('@/lib/api/memberships', () => ({
  fetchMemberships: jest.fn(),
}));

jest.mock('@/lib/api/risk_assessments', () => ({
  fetchRiskAssessmentsWithMeta: jest.fn(),
}));

describe('WorkLogsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as unknown as jest.Mock).mockReturnValue({ id: '1' });
    (useSearchParams as unknown as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key === 'tab') return 'safety_logs';
        if (key === 'userId') return '3';
        return null;
      },
    });

    (fetchMemberships as jest.Mock).mockResolvedValue([
      {
        id: 10,
        user_id: 3,
        email: 'worker@example.com',
        role: 'worker',
        active_work_session: { active: true, id: 25 },
      },
    ]);
  });

  it('対象ユーザーが指定されていればSafetyLogsを取得して表示する', async () => {
    (fetchSafetyLogs as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        work_session_id: 25,
        logged_at: '2026-01-01T00:00:00Z',
        latitude: 35.0,
        longitude: 139.0,
        battery_level: 80,
        trigger_type: 'heartbeat',
      },
    ]);

    render(<WorkLogsPage />);
    await waitFor(() => {
      expect(fetchSafetyLogs).toHaveBeenCalledWith(25);
    });

    expect(screen.getByText('定期通信')).toBeInTheDocument();
    // 位置情報は地図ボタンで表示（数値表示ではない）
    expect(screen.getByRole('button', { name: '地図で位置を表示' })).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('403のとき「権限がありません」を表示する', async () => {
    (fetchSafetyLogs as jest.Mock).mockRejectedValueOnce(new ApiError('forbidden', 403));

    render(<WorkLogsPage />);

    await screen.findByText('権限がありません');
  });

  it('リスク判定タブでRiskAssessmentsを取得して表示する', async () => {
    (useSearchParams as unknown as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key === 'tab') return 'risk_assessments';
        if (key === 'userId') return '3';
        return null;
      },
    });

    (fetchRiskAssessmentsWithMeta as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          logged_at: '2026-01-01T00:00:00Z',
          score: 50,
          level: 'caution',
          details: { reasons: ['low_battery'] },
        },
      ],
      pagination: { page: 1, perPage: 100, totalCount: 1, totalPages: 1 },
    });

    render(<WorkLogsPage />);

    await waitFor(() => {
      expect(fetchRiskAssessmentsWithMeta).toHaveBeenCalledWith(25, { page: 1, perPage: 100 });
    });

    expect(screen.getByText('注意')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('バッテリー低下')).toBeInTheDocument();
  });

  it('リスク判定タブで404のとき「見つかりません」を表示する', async () => {
    (useSearchParams as unknown as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key === 'tab') return 'risk_assessments';
        if (key === 'userId') return '3';
        return null;
      },
    });

    (fetchRiskAssessmentsWithMeta as jest.Mock).mockRejectedValueOnce(
      new ApiError('not found', 404),
    );

    render(<WorkLogsPage />);

    await screen.findByText('見つかりません');
  });
});
