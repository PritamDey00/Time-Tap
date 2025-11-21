/**
 * Unit tests for timer window calculation logic
 * Tests the core timing calculations that determine when confirmation windows open
 */

// Extract the timing calculation function for testing
function getConfirmationTiming(lastConfirmTimestamp, createdAt) {
  const now = Date.now();
  // Use lastConfirm if available, otherwise use createdAt as fallback
  const lastRef = lastConfirmTimestamp ? new Date(lastConfirmTimestamp).getTime() : new Date(createdAt).getTime();
  const elapsedMs = now - lastRef;
  const minMs = 30 * 60 * 1000; // 30 minutes
  const windowMs = 60 * 1000; // 1 minute window (30:00 to 31:00)
  
  const windowStartTime = lastRef + minMs; // 30 minutes after last confirmation
  const windowEndTime = windowStartTime + windowMs; // 31 minutes after last confirmation
  
  // If we've passed the window, calculate time until next cycle
  let msUntilWindow;
  if (now > windowEndTime) {
    // We missed the window, calculate time until next 30-minute cycle
    const cycleMs = 30 * 60 * 1000; // 30 minutes per cycle
    const cyclesSinceRef = Math.floor(elapsedMs / cycleMs);
    const nextCycleStart = lastRef + ((cyclesSinceRef + 1) * cycleMs);
    msUntilWindow = Math.max(0, nextCycleStart - now);
  } else {
    // Normal case: time until current window opens
    msUntilWindow = Math.max(0, windowStartTime - now);
  }
  
  return {
    windowStartTime,
    windowEndTime,
    elapsedMs,
    isInWindow: now >= windowStartTime && now <= windowEndTime,
    msUntilWindow,
    canConfirm: elapsedMs >= minMs && elapsedMs <= minMs + windowMs
  };
}

describe('Timer Window Calculation Logic', () => {
  let originalDateNow;
  
  beforeEach(() => {
    originalDateNow = Date.now;
  });
  
  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('Window timing calculations', () => {
    test('calculates correct window start time (30 minutes after last confirmation)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      const expectedWindowStart = new Date('2023-01-01T12:30:00.000Z').getTime();
      expect(timing.windowStartTime).toBe(expectedWindowStart);
    });

    test('calculates correct window end time (31 minutes after last confirmation)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      const expectedWindowEnd = new Date('2023-01-01T12:31:00.000Z').getTime();
      expect(timing.windowEndTime).toBe(expectedWindowEnd);
    });

    test('uses createdAt as fallback when lastConfirm is null', () => {
      const createdAt = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(null, createdAt);
      
      const expectedWindowStart = new Date('2023-01-01T12:30:00.000Z').getTime();
      expect(timing.windowStartTime).toBe(expectedWindowStart);
    });
  });

  describe('Window state detection', () => {
    test('detects when NOT in confirmation window (before 30 minutes)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:25:00.000Z').getTime(); // 25 minutes after
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(false);
      expect(timing.canConfirm).toBe(false);
      expect(timing.msUntilWindow).toBe(5 * 60 * 1000); // 5 minutes remaining
    });

    test('detects when IN confirmation window (exactly at 30 minutes)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:00.000Z').getTime(); // exactly 30 minutes
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(true);
      expect(timing.canConfirm).toBe(true);
      expect(timing.msUntilWindow).toBe(0);
    });

    test('detects when IN confirmation window (30.5 minutes)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:30:30.000Z').getTime(); // 30.5 minutes
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(true);
      expect(timing.canConfirm).toBe(true);
      expect(timing.msUntilWindow).toBe(0);
    });

    test('detects when IN confirmation window (exactly at 31 minutes)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:31:00.000Z').getTime(); // exactly 31 minutes
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(true);
      expect(timing.canConfirm).toBe(true);
      expect(timing.msUntilWindow).toBe(0);
    });

    test('detects when NOT in confirmation window (after 31 minutes)', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:32:00.000Z').getTime(); // 32 minutes after
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(false);
      expect(timing.canConfirm).toBe(false);
      expect(timing.msUntilWindow).toBe(28 * 60 * 1000); // 28 minutes until next cycle (60min - 32min = 28min)
    });
  });

  describe('Elapsed time calculations', () => {
    test('calculates correct elapsed time', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:15:30.000Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.elapsedMs).toBe(15.5 * 60 * 1000); // 15.5 minutes in ms
    });

    test('calculates time until window opens correctly', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:27:00.000Z').getTime(); // 27 minutes after
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.msUntilWindow).toBe(3 * 60 * 1000); // 3 minutes until window
    });
  });

  describe('Edge cases', () => {
    test('handles exactly 1 millisecond before window opens', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:29:59.999Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(false);
      expect(timing.canConfirm).toBe(false);
      expect(timing.msUntilWindow).toBe(1);
    });

    test('handles exactly 1 millisecond after window closes', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T12:31:00.001Z').getTime();
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(false);
      expect(timing.canConfirm).toBe(false);
      expect(timing.msUntilWindow).toBe(29 * 60 * 1000 - 1); // Almost 29 minutes until next cycle
    });

    test('calculates next cycle correctly after missing multiple windows', () => {
      const lastConfirm = '2023-01-01T12:00:00.000Z';
      const mockNow = new Date('2023-01-01T13:05:00.000Z').getTime(); // 65 minutes after (missed 2 cycles)
      Date.now = jest.fn(() => mockNow);

      const timing = getConfirmationTiming(lastConfirm, null);
      
      expect(timing.isInWindow).toBe(false);
      expect(timing.canConfirm).toBe(false);
      expect(timing.msUntilWindow).toBe(25 * 60 * 1000); // 25 minutes until next cycle (90min - 65min = 25min)
    });
  });
});