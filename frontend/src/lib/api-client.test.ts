/**
 * Unit Tests for API Client
 * Tests caching, error handling, and request formatting
 */

import * as api from './api-client';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    api.clearApiCache(); // Clear cache before each test
  });

  describe('Cache Management', () => {
    it('should return cached data on subsequent requests', async () => {
      const mockData = [{ id: '1', name: 'Test Game' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // First request
      const result1 = await api.getGames();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1.data).toEqual(mockData);

      // Second request should use cache
      const result2 = await api.getGames();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2.data).toEqual(mockData);
    });

    it('should allow manual cache clearing', async () => {
      const mockData = [{ id: '1' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // First request
      await api.getGames();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      api.clearApiCache();

      // Second request should not use cache
      await api.getGames();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear specific cache key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      // Make two different requests
      await api.getGames({ limit: 20 });
      await api.getStreamer('roshtein');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear only one key
      api.clearApiCache('games:limit=20');

      // Request with cleared key should fetch again
      await api.getGames({ limit: 20 });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Request with non-cleared key should use cache
      await api.getStreamer('roshtein');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Still 3
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.getGames();
      expect(result.error).toBeTruthy();
      expect(result.status).toBe(0);
      expect(result.data).toBeUndefined();
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      });

      const result = await api.getStreamer('nonexistent');
      expect(result.error).toBeTruthy();
      expect(result.status).toBe(404);
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

      const result = await api.getGames();
      expect(result.error).toBeTruthy();
      expect(result.status).toBe(500);
    });

    it('should include error details in response', async () => {
      const errorMsg = 'Validation failed';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: errorMsg }),
      });

      const result = await api.getGames();
      expect(result.error).toBe(errorMsg);
    });
  });

  describe('Endpoint Construction', () => {
    it('should construct proper endpoints with query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getGames({ skip: 10, limit: 20 });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('skip=10');
      expect(callUrl).toContain('limit=20');
    });

    it('should handle optional parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      // Without optional params
      await api.getGames({});
      const callUrl1 = mockFetch.mock.calls[0][0];
      expect(callUrl1).not.toContain('skip');

      mockFetch.mockClear();

      // With optional params
      await api.getGames({ skip: 5 });
      const callUrl2 = mockFetch.mock.calls[0][0];
      expect(callUrl2).toContain('skip=5');
    });

    it('should properly format API base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getStreamers();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('http://localhost:8001/api/v1');
    });
  });

  describe('Response Mapping', () => {
    it('should return data in consistent format', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.getStreamer('test');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('status');
      expect(result).not.toHaveProperty('error');
      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await api.getGames();

      expect(result.status).toBe(200);
      expect(result.data).toEqual({});
    });

    it('should handle array responses', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.getStreamer('test');

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Specific Endpoints', () => {
    it('should call getStreamers endpoint correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getStreamers({ limit: 50 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/streamers'),
        expect.any(Object)
      );
    });

    it('should call getSessions endpoint correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getSessions({ streamerId: 'roshtein' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.any(Object)
      );
    });

    it('should call getHotColdSlots with period parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getHotColdSlots(48);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('period_hours=48');
    });

    it('should call getLiveStreams endpoint correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getLiveStreams();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/live/streams'),
        expect.any(Object)
      );
    });
  });

  describe('Request Headers', () => {
    it('should include Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.getGames();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should use correct HTTP methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.getGames();

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBeUndefined(); // GET is default
    });
  });
});
