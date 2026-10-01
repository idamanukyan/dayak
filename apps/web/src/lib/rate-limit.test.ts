import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, __resetRateLimits } from './rate-limit';

beforeEach(() => __resetRateLimits());

describe('rateLimit', () => {
  it('allows up to the limit then blocks within the window', () => {
    const key = 'k';
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 1000, 0).ok).toBe(true);
    }
    const blocked = rateLimit(key, 5, 1000, 0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
  });

  it('resets after the window elapses', () => {
    const key = 'k2';
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 1000, 0);
    expect(rateLimit(key, 5, 1000, 500).ok).toBe(false); // still in window
    expect(rateLimit(key, 5, 1000, 1001).ok).toBe(true); // window elapsed
  });

  it('tracks keys independently', () => {
    for (let i = 0; i < 5; i++) rateLimit('a', 5, 1000, 0);
    expect(rateLimit('a', 5, 1000, 0).ok).toBe(false);
    expect(rateLimit('b', 5, 1000, 0).ok).toBe(true);
  });

  it('reports remaining', () => {
    expect(rateLimit('c', 3, 1000, 0).remaining).toBe(2);
    expect(rateLimit('c', 3, 1000, 0).remaining).toBe(1);
  });
});
