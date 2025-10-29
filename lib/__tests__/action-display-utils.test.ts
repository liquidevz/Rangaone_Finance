/**
 * Tests for action display utility functions
 */

/// <reference types="jest" />

import { formatActionForDisplay, getActionColorScheme } from '../action-display-utils';

describe('formatActionForDisplay', () => {
  test('should transform ADDON-BUY to Buy More', () => {
    expect(formatActionForDisplay('ADDON-BUY')).toBe('Buy More');
    expect(formatActionForDisplay('addon-buy')).toBe('Buy More');
    expect(formatActionForDisplay('Addon-Buy')).toBe('Buy More');
  });

  test('should handle other common actions', () => {
    expect(formatActionForDisplay('FRESH-BUY')).toBe('Fresh Buy');
    expect(formatActionForDisplay('BUY')).toBe('Buy');
    expect(formatActionForDisplay('HOLD')).toBe('Hold');
    expect(formatActionForDisplay('SELL')).toBe('Sell');
    expect(formatActionForDisplay('PARTIAL-SELL')).toBe('Partial Sell');
  });

  test('should handle empty or undefined input', () => {
    expect(formatActionForDisplay('')).toBe('Fresh Buy');
    expect(formatActionForDisplay(undefined as any)).toBe('Fresh Buy');
  });
});

describe('getActionColorScheme', () => {
  test('should return correct color scheme for ADDON-BUY', () => {
    expect(getActionColorScheme('ADDON-BUY')).toBe('bg-green-600 text-white');
    expect(getActionColorScheme('Buy More')).toBe('bg-green-600 text-white');
  });

  test('should handle other actions correctly', () => {
    expect(getActionColorScheme('FRESH-BUY')).toBe('bg-green-500 text-white');
    expect(getActionColorScheme('HOLD')).toBe('bg-blue-500 text-white');
    expect(getActionColorScheme('SELL')).toBe('bg-red-500 text-white');
    expect(getActionColorScheme('PARTIAL-SELL')).toBe('bg-orange-500 text-white');
  });
});