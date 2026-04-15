import { describe, test, expect, mock, beforeEach } from 'bun:test';

// Mock jquantsApi so the pre-fix path (no guard) would throw just like the
// real implementation does when JQUANTS_API_KEY is missing.
const mockGet = mock();
mock.module('./jquants-api.js', () => ({
  jquantsApi: { get: mockGet },
}));

import { getEarnings } from './earnings.js';

beforeEach(() => {
  mockGet.mockReset();
  delete process.env.JQUANTS_API_KEY;
});

describe('getEarnings – JQUANTS_API_KEY unset (regression for 1f6a9203)', () => {
  // Before the fix, calling the tool without JQUANTS_API_KEY would fall
  // through to jquantsApi.get(), which threw an unhandled Error:
  //   "[J-Quants] JQUANTS_API_KEY is not set …"
  // The fix added an early guard that returns a structured JSON result.

  test('returns a graceful unavailable result instead of throwing', async () => {
    mockGet.mockRejectedValue(
      new Error('[J-Quants] JQUANTS_API_KEY is not set.'),
    );

    const result = await getEarnings.invoke({});

    // Should NOT have reached jquantsApi.get()
    expect(mockGet).not.toHaveBeenCalled();

    // Should return parseable JSON with an unavailable flag
    const parsed = JSON.parse(result);
    expect(parsed.data).toMatchObject({ unavailable: true });
    expect(parsed.data.reason).toContain('JQUANTS_API_KEY');
  });

  test('returns graceful result when a stock code is provided', async () => {
    mockGet.mockRejectedValue(
      new Error('[J-Quants] JQUANTS_API_KEY is not set.'),
    );

    const result = await getEarnings.invoke({ code: '7203' });

    expect(mockGet).not.toHaveBeenCalled();

    const parsed = JSON.parse(result);
    expect(parsed.data).toMatchObject({ unavailable: true });
    expect(parsed.data.reason).toContain('JQUANTS_API_KEY');
  });

  test('does not include sourceUrls in the unavailable response', async () => {
    const result = await getEarnings.invoke({});

    const parsed = JSON.parse(result);
    expect(parsed.sourceUrls).toBeUndefined();
  });

  test('proceeds to jquantsApi when JQUANTS_API_KEY IS set', async () => {
    process.env.JQUANTS_API_KEY = 'test-key';
    mockGet.mockResolvedValue({
      data: { data: [] },
      url: 'https://api.jquants.com/v2/equities/earnings-calendar',
    });

    const result = await getEarnings.invoke({});

    expect(mockGet).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(result);
    expect(parsed.data).toEqual([]);
  });
});
