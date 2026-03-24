import { fmt } from '@/lib/format';
import { STATE_NAMES } from '@/lib/constants';

describe('fmt()', () => {
  it('formats billions', () => {
    expect(fmt(1_234_567_890)).toBe('$1.2B');
    expect(fmt(5_000_000_000)).toBe('$5.0B');
  });

  it('formats millions', () => {
    expect(fmt(1_234_567)).toBe('$1.2M');
    expect(fmt(5_500_000)).toBe('$5.5M');
    expect(fmt(1_000_000)).toBe('$1.0M');
  });

  it('formats thousands', () => {
    expect(fmt(1_234)).toBe('$1K');
    expect(fmt(5_500)).toBe('$6K');
    expect(fmt(1_000)).toBe('$1K');
    expect(fmt(999_999)).toBe('$1000K');
  });

  it('formats small numbers', () => {
    expect(fmt(999)).toBe('$999');
    expect(fmt(0)).toBe('$0');
    expect(fmt(42)).toBe('$42');
  });
});

describe('STATE_NAMES', () => {
  it('contains all 8 Australian states and territories', () => {
    expect(Object.keys(STATE_NAMES)).toHaveLength(8);
  });

  it('maps abbreviations to full names', () => {
    expect(STATE_NAMES.NT).toBe('Northern Territory');
    expect(STATE_NAMES.QLD).toBe('Queensland');
    expect(STATE_NAMES.NSW).toBe('New South Wales');
    expect(STATE_NAMES.VIC).toBe('Victoria');
    expect(STATE_NAMES.WA).toBe('Western Australia');
    expect(STATE_NAMES.SA).toBe('South Australia');
    expect(STATE_NAMES.TAS).toBe('Tasmania');
    expect(STATE_NAMES.ACT).toBe('Australian Capital Territory');
  });

  it('has correct type signature', () => {
    const keys: string[] = Object.keys(STATE_NAMES);
    const values: string[] = Object.values(STATE_NAMES);
    expect(keys.every((k) => typeof k === 'string')).toBe(true);
    expect(values.every((v) => typeof v === 'string')).toBe(true);
  });
});
