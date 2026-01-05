import { apiRequest, ApiError } from '@/lib/api/client';

// fetch をモック
global.fetch = jest.fn();

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET リクエストが成功する', async () => {
    const mockData = { id: 1, name: 'Test' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const response = await apiRequest<typeof mockData>('GET', '/api/test');

    expect(response.data).toEqual(mockData);
    expect(response.error).toBeNull();
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('POST リクエストが成功する', async () => {
    const requestBody = { name: 'New Item' };
    const mockResponse = { id: 2, name: 'New Item' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const response = await apiRequest<typeof mockResponse>('POST', '/api/items', {
      body: requestBody,
    });

    expect(response.data).toEqual(mockResponse);
    expect(response.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
      }),
    );
  });

  it('エラーレスポンスを適切に処理する', async () => {
    const errorBody = { error: 'Not Found' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errorBody,
      text: async () => JSON.stringify(errorBody),
    });

    const response = await apiRequest('GET', '/api/notfound');

    expect(response.data).toBeNull();
    expect(response.error).toBeTruthy();
    expect(response.status).toBe(404);
    expect(response.errorBody).toEqual(errorBody);
  });

  it('ネットワークエラーを処理する', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const response = await apiRequest('GET', '/api/test');

    expect(response.data).toBeNull();
    expect(response.error).toContain('ネットワークエラー');
    expect(response.status).toBe(0);
  });

  it('204 No Content を正しく処理する', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const response = await apiRequest('DELETE', '/api/items/1');

    expect(response.data).toBeNull();
    expect(response.error).toBeNull();
    expect(response.status).toBe(204);
  });
});
