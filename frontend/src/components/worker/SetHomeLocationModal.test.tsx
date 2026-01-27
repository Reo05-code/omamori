import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetHomeLocationModal from './SetHomeLocationModal';
import { updateUser } from '@/lib/api/auth';
import * as geolocation from '@/lib/geolocation';
import type { UpdateUserResponse } from '@/lib/api/types';

// モック設定
jest.mock('@/lib/api/auth');
jest.mock('@/lib/geolocation');

// MapSelector のモック（Leaflet の SSR 問題を回避）
jest.mock('./MapSelector', () => {
  return function MockMapSelector({
    selectedLat,
    selectedLon,
    radius,
    onChange,
  }: {
    selectedLat: number | null;
    selectedLon: number | null;
    radius: number;
    onChange: (lat: number, lon: number) => void;
  }) {
    return (
      <div data-testid="map-selector">
        <button
          type="button"
          onClick={() => onChange(35.6812, 139.7671)}
          data-testid="mock-select-location"
        >
          位置を選択 (モック)
        </button>
        {selectedLat && selectedLon && (
          <div data-testid="selected-coords">
            {selectedLat}, {selectedLon} (半径 {radius}m)
          </div>
        )}
      </div>
    );
  };
});

describe('SetHomeLocationModal', () => {
  const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
  const mockGetCurrentPosition = geolocation.getCurrentPosition as jest.MockedFunction<
    typeof geolocation.getCurrentPosition
  >;

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onCompleted: jest.fn(),
    onNotify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentPosition.mockResolvedValue({
      latitude: 35.6812,
      longitude: 139.7671,
      accuracy: 10,
    });
  });

  it('モーダルが開いている場合に表示される', () => {
    render(<SetHomeLocationModal {...defaultProps} />);
    expect(screen.getByText('拠点を設定しましょう')).toBeInTheDocument();
  });

  it('モーダルが閉じている場合は表示されない', () => {
    render(<SetHomeLocationModal {...defaultProps} open={false} />);
    expect(screen.queryByText('拠点を設定しましょう')).not.toBeInTheDocument();
  });

  it('地図から座標を選択できる', async () => {
    const user = userEvent.setup();
    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択（モック）
    await user.click(screen.getByTestId('mock-select-location'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-coords')).toHaveTextContent('35.6812, 139.7671');
    });
  });

  it('半径を選択できる', async () => {
    const user = userEvent.setup();
    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択
    await user.click(screen.getByTestId('mock-select-location'));

    // 100m ボタンをクリック
    const button100m = screen.getByRole('button', { name: /100m/i });
    await user.click(button100m);

    await waitFor(() => {
      expect(screen.getByTestId('selected-coords')).toHaveTextContent('半径 100m');
    });
  });

  it('座標未選択時は送信ボタンが無効化される', () => {
    render(<SetHomeLocationModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /設定する/i });
    expect(submitButton).toBeDisabled();
  });

  it('座標選択後は送信ボタンが有効化される', async () => {
    const user = userEvent.setup();
    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択
    await user.click(screen.getByTestId('mock-select-location'));

    const submitButton = screen.getByRole('button', { name: /設定する/i });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('API送信成功時にトースト表示とコールバック実行', async () => {
    const user = userEvent.setup();
    const mockData: UpdateUserResponse = {
      status: 'success',
      data: {
        id: 1,
        email: 'test@example.com',
        provider: 'email',
        uid: 'test@example.com',
        name: 'Test User',
        phone_number: '',
        avatar_url: null,
        allow_password_change: true,
        settings: {},
        home_latitude: 35.6812,
        home_longitude: 139.7671,
        home_radius: 50,
        onboarded: true,
        created_at: '2026-01-26T00:00:00Z',
        updated_at: '2026-01-26T00:00:00Z',
      },
    };
    mockUpdateUser.mockResolvedValue({
      data: mockData,
      error: null,
      status: 200,
    } as any);

    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択
    await user.click(screen.getByTestId('mock-select-location'));

    // 送信
    const submitButton = screen.getByRole('button', { name: /設定する/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        home_latitude: 35.6812,
        home_longitude: 139.7671,
        home_radius: 50 as const,
      });
      expect(defaultProps.onNotify).toHaveBeenCalledWith('拠点を設定しました', 'success');
      expect(defaultProps.onCompleted).toHaveBeenCalledWith(mockData.data);
    });
  });

  it('API送信失敗時にエラーメッセージを表示', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockRejectedValue(new Error('Network error'));

    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択
    await user.click(screen.getByTestId('mock-select-location'));

    // 送信
    const submitButton = screen.getByRole('button', { name: /設定する/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/設定に失敗しました/i)).toBeInTheDocument();
    });
  });

  it('forceCreate=trueの場合「あとで設定」ボタンが表示されない', () => {
    render(<SetHomeLocationModal {...defaultProps} forceCreate={true} />);

    expect(screen.queryByRole('button', { name: /あとで設定/i })).not.toBeInTheDocument();
  });

  it('forceCreate=falseの場合「あとで設定」ボタンが表示される', () => {
    render(<SetHomeLocationModal {...defaultProps} forceCreate={false} />);

    expect(screen.getByRole('button', { name: /あとで設定/i })).toBeInTheDocument();
  });

  it('「あとで設定」ボタンでモーダルが閉じる', async () => {
    const user = userEvent.setup();
    render(<SetHomeLocationModal {...defaultProps} forceCreate={false} />);

    const skipButton = screen.getByRole('button', { name: /あとで設定/i });
    await user.click(skipButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('送信中は二重送信を防止する', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    render(<SetHomeLocationModal {...defaultProps} />);

    // 地図で位置を選択
    await user.click(screen.getByTestId('mock-select-location'));

    // 送信
    const submitButton = screen.getByRole('button', { name: /設定する/i });
    await user.click(submitButton);

    // 送信中はボタンが無効化
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /読み込み中/i })).toBeDisabled();
    });
  });
});
