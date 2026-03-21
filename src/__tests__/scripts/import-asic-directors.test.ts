/**
 * Tests for ASIC Directors Import Script
 *
 * Tests the pure functions used by import-asic-directors.mjs:
 * - ABN normalization and matching
 * - CSV row parsing and field extraction
 * - Board overlap detection
 * - Dedup logic (skip recent imports)
 * - ASIC director data structure building
 */

// We test the logic functions directly - they are extracted as a module
// so both the script and tests can import them.

import {
  normalizeABN,
  parseOfficerRow,
  parseCompanyRow,
  buildAsicDirectorsPayload,
  detectBoardOverlaps,
  shouldSkipImport,
} from '@/lib/asic/asic-import-utils';

describe('normalizeABN', () => {
  it('strips spaces and leading zeros from ABN strings', () => {
    expect(normalizeABN('51 824 753 556')).toBe('51824753556');
    expect(normalizeABN(' 51824753556 ')).toBe('51824753556');
  });

  it('returns null for empty or invalid ABN values', () => {
    expect(normalizeABN('')).toBeNull();
    expect(normalizeABN(null as any)).toBeNull();
    expect(normalizeABN(undefined as any)).toBeNull();
  });

  it('handles numeric ABN input', () => {
    expect(normalizeABN(51824753556 as any)).toBe('51824753556');
  });

  it('rejects ABN strings that are not 11 digits after normalization', () => {
    expect(normalizeABN('1234')).toBeNull();
    expect(normalizeABN('123456789012')).toBeNull(); // 12 digits
  });
});

describe('parseCompanyRow', () => {
  it('extracts company fields from a CSV row object', () => {
    const row = {
      'Company Name': 'ACME CORPORATION PTY LTD',
      'ABN': '51 824 753 556',
      'Company Status': 'Registered',
      'Company Type': 'Australian Proprietary Company',
      'Company Sub Type': 'Proprietary Company',
      'ACN': '123456789',
    };
    const result = parseCompanyRow(row);
    expect(result).toEqual({
      abn: '51824753556',
      name: 'ACME CORPORATION PTY LTD',
      status: 'Registered',
      type: 'Australian Proprietary Company',
    });
  });

  it('returns null when ABN is missing or invalid', () => {
    const row = { 'Company Name': 'ACME', 'ABN': '', 'Company Status': 'Registered', 'Company Type': 'Pty' };
    expect(parseCompanyRow(row)).toBeNull();
  });

  it('handles alternative column name casing', () => {
    const row = {
      'company_name': 'TEST CO',
      'abn': '12345678901',
      'company_status': 'Registered',
      'company_type': 'Public',
    };
    const result = parseCompanyRow(row);
    expect(result).not.toBeNull();
    expect(result!.abn).toBe('12345678901');
  });
});

describe('parseOfficerRow', () => {
  it('extracts officer fields from a CSV row object', () => {
    const row = {
      'Company Name': 'ACME CORP',
      'ABN': '51 824 753 556',
      'Officer Name': 'SMITH, Jane',
      'Officer Role': 'Director',
      'Date Appointed': '01/03/2020',
    };
    const result = parseOfficerRow(row);
    expect(result).toEqual({
      abn: '51824753556',
      name: 'Jane Smith',
      role: 'Director',
      appointed: '2020-03-01',
    });
  });

  it('normalizes SURNAME, First format to First Surname', () => {
    const row = {
      'ABN': '51824753556',
      'Officer Name': 'JONES, Robert James',
      'Officer Role': 'Secretary',
      'Date Appointed': '15/06/2019',
    };
    const result = parseOfficerRow(row);
    expect(result!.name).toBe('Robert James Jones');
  });

  it('handles names without comma (already First Last)', () => {
    const row = {
      'ABN': '51824753556',
      'Officer Name': 'Jane Smith',
      'Officer Role': 'Director',
      'Date Appointed': '01/01/2021',
    };
    const result = parseOfficerRow(row);
    expect(result!.name).toBe('Jane Smith');
  });

  it('returns null when officer name is missing', () => {
    const row = { 'ABN': '51824753556', 'Officer Name': '', 'Officer Role': 'Director' };
    expect(parseOfficerRow(row)).toBeNull();
  });

  it('handles missing appointment date gracefully', () => {
    const row = {
      'ABN': '51824753556',
      'Officer Name': 'SMITH, Jane',
      'Officer Role': 'Director',
    };
    const result = parseOfficerRow(row);
    expect(result).not.toBeNull();
    expect(result!.appointed).toBeNull();
  });
});

describe('buildAsicDirectorsPayload', () => {
  it('builds the JSONB payload for organizations.acnc_data', () => {
    const officers = [
      { abn: '51824753556', name: 'Jane Smith', role: 'Director', appointed: '2020-01-15' },
      { abn: '51824753556', name: 'Bob Jones', role: 'Secretary', appointed: '2019-06-01' },
    ];
    const company = { abn: '51824753556', name: 'ACME', status: 'Registered', type: 'Public' };

    const payload = buildAsicDirectorsPayload(officers, company);

    expect(payload.asic_directors.officers).toHaveLength(2);
    expect(payload.asic_directors.officers[0]).toEqual({
      name: 'Jane Smith',
      role: 'Director',
      appointed: '2020-01-15',
    });
    expect(payload.asic_directors.company_status).toBe('Registered');
    expect(payload.asic_directors.company_type).toBe('Public');
    expect(payload.asic_directors.updated_at).toBeDefined();
  });

  it('deduplicates officers with same name and role', () => {
    const officers = [
      { abn: '51824753556', name: 'Jane Smith', role: 'Director', appointed: '2020-01-15' },
      { abn: '51824753556', name: 'Jane Smith', role: 'Director', appointed: '2020-01-15' },
    ];
    const company = { abn: '51824753556', name: 'ACME', status: 'Registered', type: 'Public' };

    const payload = buildAsicDirectorsPayload(officers, company);
    expect(payload.asic_directors.officers).toHaveLength(1);
  });
});

describe('detectBoardOverlaps', () => {
  it('finds people appearing in multiple organizations', () => {
    const orgDirectors = new Map<string, { orgName: string; officers: Array<{ name: string; role: string }> }>();
    orgDirectors.set('org-1', {
      orgName: 'Justice Org A',
      officers: [
        { name: 'Jane Smith', role: 'Director' },
        { name: 'Unique Person', role: 'CEO' },
      ],
    });
    orgDirectors.set('org-2', {
      orgName: 'Justice Org B',
      officers: [
        { name: 'Jane Smith', role: 'Chair' },
        { name: 'Another Person', role: 'Director' },
      ],
    });
    orgDirectors.set('org-3', {
      orgName: 'Justice Org C',
      officers: [
        { name: 'Jane Smith', role: 'Secretary' },
      ],
    });

    const overlaps = detectBoardOverlaps(orgDirectors);

    expect(overlaps).toHaveLength(1);
    expect(overlaps[0].person).toBe('Jane Smith');
    expect(overlaps[0].orgs).toHaveLength(3);
    expect(overlaps[0].overlap_type).toBe('board_interlock');
  });

  it('returns empty array when no overlaps exist', () => {
    const orgDirectors = new Map<string, { orgName: string; officers: Array<{ name: string; role: string }> }>();
    orgDirectors.set('org-1', {
      orgName: 'Org A',
      officers: [{ name: 'Person A', role: 'Director' }],
    });
    orgDirectors.set('org-2', {
      orgName: 'Org B',
      officers: [{ name: 'Person B', role: 'Director' }],
    });

    const overlaps = detectBoardOverlaps(orgDirectors);
    expect(overlaps).toHaveLength(0);
  });

  it('normalizes names for case-insensitive matching', () => {
    const orgDirectors = new Map<string, { orgName: string; officers: Array<{ name: string; role: string }> }>();
    orgDirectors.set('org-1', {
      orgName: 'Org A',
      officers: [{ name: 'JANE SMITH', role: 'Director' }],
    });
    orgDirectors.set('org-2', {
      orgName: 'Org B',
      officers: [{ name: 'jane smith', role: 'Chair' }],
    });

    const overlaps = detectBoardOverlaps(orgDirectors);
    expect(overlaps).toHaveLength(1);
  });
});

describe('shouldSkipImport', () => {
  it('returns true when updated_at is within 7 days', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const acncData = {
      asic_directors: {
        updated_at: threeDaysAgo,
        officers: [],
        company_status: 'Registered',
        company_type: 'Public',
      },
    };
    expect(shouldSkipImport(acncData)).toBe(true);
  });

  it('returns false when updated_at is older than 7 days', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const acncData = {
      asic_directors: {
        updated_at: tenDaysAgo,
        officers: [],
        company_status: 'Registered',
        company_type: 'Public',
      },
    };
    expect(shouldSkipImport(acncData)).toBe(false);
  });

  it('returns false when acnc_data is null or missing asic_directors', () => {
    expect(shouldSkipImport(null)).toBe(false);
    expect(shouldSkipImport({})).toBe(false);
    expect(shouldSkipImport({ other_key: true })).toBe(false);
  });
});
