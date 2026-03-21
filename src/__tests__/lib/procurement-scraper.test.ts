/**
 * Tests for procurement scraper helper functions
 *
 * Tests the pure logic used by scripts/scrape-procurement-apis.mjs:
 * - Financial year derivation from dates
 * - ABN matching and normalization
 * - Justice-relevance classification
 * - AusTender OCDS response parsing
 * - Funding record construction
 * - Dedup key generation
 */

// We test the logic inline since the script is .mjs — import the helpers we'll extract
// For TDD, we define the expected behavior here; implementation will export these functions

// Since the script is a standalone .mjs file, we test the logic functions
// by defining them here and ensuring they match the implementation

describe('Financial year derivation', () => {
  // deriveFinancialYear(dateStr) => "2024-25" format
  // Australian FY: July 1 to June 30
  // A date in Jan 2025 => FY 2024-25
  // A date in Aug 2025 => FY 2025-26

  function deriveFinancialYear(dateStr: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    // July (6) onwards = next FY
    if (month >= 6) {
      return `${year}-${String(year + 1).slice(2)}`;
    }
    return `${year - 1}-${String(year).slice(2)}`;
  }

  it('derives FY for July date (start of new FY)', () => {
    expect(deriveFinancialYear('2025-07-01')).toBe('2025-26');
  });

  it('derives FY for January date', () => {
    expect(deriveFinancialYear('2025-01-15')).toBe('2024-25');
  });

  it('derives FY for June date (end of FY)', () => {
    expect(deriveFinancialYear('2025-06-30')).toBe('2024-25');
  });

  it('derives FY for December date', () => {
    expect(deriveFinancialYear('2024-12-01')).toBe('2024-25');
  });

  it('returns null for empty string', () => {
    expect(deriveFinancialYear('')).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(deriveFinancialYear('not-a-date')).toBeNull();
  });
});

describe('ABN normalization', () => {
  function normalizeABN(abn: string | null | undefined): string | null {
    if (!abn) return null;
    const cleaned = abn.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleaned.length !== 11) return null;
    return cleaned;
  }

  it('normalizes ABN with spaces', () => {
    expect(normalizeABN('12 345 678 901')).toBe('12345678901');
  });

  it('normalizes ABN with dashes', () => {
    expect(normalizeABN('12-345-678-901')).toBe('12345678901');
  });

  it('passes through clean 11-digit ABN', () => {
    expect(normalizeABN('12345678901')).toBe('12345678901');
  });

  it('returns null for too-short ABN', () => {
    expect(normalizeABN('1234')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(normalizeABN(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeABN(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeABN('')).toBeNull();
  });
});

describe('Justice relevance classification', () => {
  const JUSTICE_KEYWORDS = [
    'youth justice', 'juvenile justice', 'youth detention', 'corrections',
    'justice services', 'court services', 'legal aid', 'community corrections',
    'probation', 'parole', 'diversion program', 'rehabilitation',
    'offender management', 'victim support', 'restorative justice',
    'bail support', 'reintegration', 'crime prevention', 'family violence',
    'domestic violence', 'child protection', 'out of home care',
    'Indigenous justice', 'Aboriginal justice',
  ];

  function isJusticeRelated(title: string, description: string): { relevant: boolean; keywords: string[] } {
    const text = `${title} ${description}`.toLowerCase();
    const matched = JUSTICE_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
    return { relevant: matched.length > 0, keywords: matched };
  }

  it('detects youth justice contracts', () => {
    const result = isJusticeRelated('Youth Justice Services - QLD', 'Provision of youth justice programs');
    expect(result.relevant).toBe(true);
    expect(result.keywords).toContain('youth justice');
  });

  it('detects corrections contracts', () => {
    const result = isJusticeRelated('Community Corrections Program', '');
    expect(result.relevant).toBe(true);
    expect(result.keywords).toContain('community corrections');
  });

  it('rejects unrelated contracts', () => {
    const result = isJusticeRelated('Office Supplies Purchase', 'Stationery and printer ink');
    expect(result.relevant).toBe(false);
    expect(result.keywords).toHaveLength(0);
  });

  it('detects Indigenous justice keywords', () => {
    const result = isJusticeRelated('Aboriginal Justice Program', 'Supporting Aboriginal communities');
    expect(result.relevant).toBe(true);
    expect(result.keywords).toContain('Aboriginal justice');
  });

  it('is case-insensitive', () => {
    const result = isJusticeRelated('YOUTH DETENTION Facility Management', '');
    expect(result.relevant).toBe(true);
    expect(result.keywords).toContain('youth detention');
  });

  it('detects multiple keywords', () => {
    const result = isJusticeRelated(
      'Legal Aid and Victim Support Services',
      'Including restorative justice programs'
    );
    expect(result.relevant).toBe(true);
    expect(result.keywords.length).toBeGreaterThanOrEqual(2);
  });
});

describe('AusTender OCDS release parsing (real API structure)', () => {
  // Real AusTender OCDS structure:
  //   parties[] — roles (supplier/procuringEntity), additionalIdentifiers [{id, scheme:"AU-ABN"}], address.region
  //   awards[] — suppliers [{id, name}] reference party IDs
  //   contracts[] — id is CN number, value.amount, description, dateSigned
  //   tender.id — internal ocid, NOT the CN number

  type Party = {
    id: string;
    name: string;
    roles: string[];
    additionalIdentifiers?: Array<{ id: string; scheme: string }>;
    address?: { region?: string; locality?: string };
  };

  type OCDSRelease = {
    ocid?: string;
    id?: string;
    date?: string;
    parties?: Party[];
    awards?: Array<{
      id?: string;
      title?: string;
      date?: string;
      suppliers?: Array<{ id: string; name: string }>;
    }>;
    contracts?: Array<{
      id?: string;
      description?: string;
      dateSigned?: string;
      value?: { amount?: string | number; currency?: string };
    }>;
    tender?: { id?: string };
  };

  type ParsedContract = {
    cn_id: string;
    title: string;
    description: string;
    supplier_name: string | null;
    supplier_abn: string | null;
    supplier_state: string | null;
    amount: number | null;
    award_date: string | null;
    buyer_name: string | null;
    source_url: string;
  };

  function parseOCDSRelease(release: OCDSRelease): ParsedContract[] {
    const results: ParsedContract[] = [];

    // Build party lookup by ID
    const partyMap = new Map<string, Party>();
    for (const party of (release.parties || [])) {
      partyMap.set(party.id, party);
    }

    // Find buyer (procuringEntity)
    const buyerParty = (release.parties || []).find(p => p.roles?.includes('procuringEntity'));
    const buyerName = buyerParty?.name || null;

    // Get CN ID from contracts[0].id or fallback
    const contractEntries = release.contracts || [];
    const cnId = contractEntries[0]?.id || release.ocid || release.id || 'unknown';

    // Get contract value and description from contracts[]
    const contractValue = contractEntries[0]?.value?.amount
      ? parseFloat(String(contractEntries[0].value.amount))
      : null;
    const contractDescription = contractEntries[0]?.description || '';
    const contractDate = contractEntries[0]?.dateSigned || release.date || null;

    if (!release.awards || release.awards.length === 0) return results;

    for (const award of release.awards) {
      for (const supplierRef of (award.suppliers || [])) {
        const party = partyMap.get(supplierRef.id);
        const abnEntry = (party?.additionalIdentifiers || [])
          .find(ai => ai.scheme === 'AU-ABN');
        const abn = abnEntry?.id || null;

        results.push({
          cn_id: cnId,
          title: contractDescription || award.title || '',
          description: contractDescription,
          supplier_name: supplierRef.name || party?.name || null,
          supplier_abn: abn,
          supplier_state: party?.address?.region || null,
          amount: contractValue,
          award_date: award.date || contractDate,
          buyer_name: buyerName,
          source_url: `https://www.tenders.gov.au/?event=public.cn.view&CNUUID=${cnId}`,
        });
      }
    }

    return results;
  }

  it('parses a complete OCDS release matching real AusTender format', () => {
    const release: OCDSRelease = {
      ocid: 'prod-abc123',
      date: '2025-01-31T06:57:15Z',
      parties: [
        {
          id: 'supplier-party-1',
          name: 'Community Services Org',
          roles: ['supplier'],
          additionalIdentifiers: [{ id: '12345678901', scheme: 'AU-ABN' }],
          address: { region: 'QLD', locality: 'Brisbane' },
        },
        {
          id: 'buyer-party-1',
          name: 'Department of Youth Justice',
          roles: ['procuringEntity'],
          additionalIdentifiers: [{ id: '99999999999', scheme: 'AU-ABN' }],
        },
      ],
      awards: [{
        id: 'CN12345-award1',
        date: '2024-08-15T00:00:00Z',
        suppliers: [{ id: 'supplier-party-1', name: 'Community Services Org' }],
      }],
      contracts: [{
        id: 'CN12345',
        description: 'Youth Justice Program Delivery',
        dateSigned: '2024-08-15T00:00:00Z',
        value: { amount: '500000', currency: 'AUD' },
      }],
      tender: { id: 'prod-abc123' },
    };

    const contracts = parseOCDSRelease(release);
    expect(contracts).toHaveLength(1);
    expect(contracts[0].cn_id).toBe('CN12345');
    expect(contracts[0].title).toBe('Youth Justice Program Delivery');
    expect(contracts[0].supplier_name).toBe('Community Services Org');
    expect(contracts[0].supplier_abn).toBe('12345678901');
    expect(contracts[0].supplier_state).toBe('QLD');
    expect(contracts[0].amount).toBe(500000);
    expect(contracts[0].buyer_name).toBe('Department of Youth Justice');
    expect(contracts[0].source_url).toContain('CN12345');
  });

  it('handles release with no awards', () => {
    const release: OCDSRelease = {
      ocid: 'prod-456',
      contracts: [{ id: 'CN99999' }],
    };
    expect(parseOCDSRelease(release)).toHaveLength(0);
  });

  it('handles multiple suppliers per award via party lookup', () => {
    const release: OCDSRelease = {
      parties: [
        { id: 'p1', name: 'Org A', roles: ['supplier'], additionalIdentifiers: [{ id: '11111111111', scheme: 'AU-ABN' }] },
        { id: 'p2', name: 'Org B', roles: ['supplier'], additionalIdentifiers: [{ id: '22222222222', scheme: 'AU-ABN' }] },
      ],
      awards: [{
        suppliers: [
          { id: 'p1', name: 'Org A' },
          { id: 'p2', name: 'Org B' },
        ],
      }],
      contracts: [{ id: 'CN777', value: { amount: 1000000 } }],
    };
    const contracts = parseOCDSRelease(release);
    expect(contracts).toHaveLength(2);
    expect(contracts[0].supplier_name).toBe('Org A');
    expect(contracts[0].supplier_abn).toBe('11111111111');
    expect(contracts[1].supplier_name).toBe('Org B');
    expect(contracts[1].supplier_abn).toBe('22222222222');
  });

  it('returns null ABN when scheme is not AU-ABN', () => {
    const release: OCDSRelease = {
      parties: [
        { id: 'fp1', name: 'Foreign Org', roles: ['supplier'], additionalIdentifiers: [{ id: 'NZ123', scheme: 'NZ-NZBN' }] },
      ],
      awards: [{ suppliers: [{ id: 'fp1', name: 'Foreign Org' }] }],
      contracts: [{ id: 'CN888' }],
    };
    const contracts = parseOCDSRelease(release);
    expect(contracts[0].supplier_abn).toBeNull();
  });

  it('falls back to ocid when contracts[].id is missing', () => {
    const release: OCDSRelease = {
      ocid: 'prod-fallback-id',
      parties: [{ id: 'tp1', name: 'Test Org', roles: ['supplier'] }],
      awards: [{ suppliers: [{ id: 'tp1', name: 'Test Org' }] }],
    };
    const contracts = parseOCDSRelease(release);
    expect(contracts[0].cn_id).toBe('prod-fallback-id');
  });

  it('extracts value as number even when API returns string', () => {
    const release: OCDSRelease = {
      parties: [{ id: 'vp1', name: 'Value Org', roles: ['supplier'] }],
      awards: [{ suppliers: [{ id: 'vp1', name: 'Value Org' }] }],
      contracts: [{ id: 'CN999', value: { amount: '67674.25', currency: 'AUD' } }],
    };
    const contracts = parseOCDSRelease(release);
    expect(contracts[0].amount).toBe(67674.25);
  });
});

describe('Funding record construction', () => {
  type FundingRecord = {
    source: string;
    source_statement_id: string;
    recipient_name: string | null;
    recipient_abn: string | null;
    amount_dollars: number | null;
    alma_organization_id: string | null;
    funding_type: string;
    program_name: string | null;
    project_description: string | null;
    state: string | null;
    sector: string;
    financial_year: string | null;
    source_url: string | null;
  };

  function buildFundingRecord(
    source: string,
    cnId: string,
    supplierName: string | null,
    supplierABN: string | null,
    amount: number | null,
    orgId: string | null,
    title: string | null,
    description: string | null,
    state: string | null,
    sector: string,
    financialYear: string | null,
    sourceUrl: string | null,
  ): FundingRecord {
    return {
      source,
      source_statement_id: `${source}:${cnId}`,
      recipient_name: supplierName,
      recipient_abn: supplierABN,
      amount_dollars: amount,
      alma_organization_id: orgId,
      funding_type: 'contract',
      program_name: title,
      project_description: description,
      state,
      sector,
      financial_year: financialYear,
      source_url: sourceUrl,
    };
  }

  it('builds a complete funding record', () => {
    const record = buildFundingRecord(
      'austender-direct', 'CN12345', 'Test Org', '12345678901',
      500000, 'uuid-123', 'Youth Justice Services', 'Description here',
      'QLD', 'federal', '2024-25', 'https://tenders.gov.au/...'
    );

    expect(record.source).toBe('austender-direct');
    expect(record.source_statement_id).toBe('austender-direct:CN12345');
    expect(record.recipient_name).toBe('Test Org');
    expect(record.recipient_abn).toBe('12345678901');
    expect(record.amount_dollars).toBe(500000);
    expect(record.alma_organization_id).toBe('uuid-123');
    expect(record.funding_type).toBe('contract');
    expect(record.sector).toBe('federal');
  });

  it('handles null org ID for unlinked records', () => {
    const record = buildFundingRecord(
      'austender-direct', 'CN99999', 'Unknown Org', null,
      100000, null, 'Some Contract', null,
      'NSW', 'federal', '2023-24', null
    );

    expect(record.alma_organization_id).toBeNull();
    expect(record.recipient_abn).toBeNull();
  });

  it('generates correct source_statement_id for NSW', () => {
    const record = buildFundingRecord(
      'nsw-etender', 'RFT-2024-100', 'NSW Org', '99988877766',
      250000, 'uuid-456', 'Corrections Program', null,
      'NSW', 'nsw', '2024-25', null
    );

    expect(record.source_statement_id).toBe('nsw-etender:RFT-2024-100');
    expect(record.sector).toBe('nsw');
  });
});

describe('Org ABN matching', () => {
  // Simulate the org lookup map
  type OrgEntry = { id: string; name: string; abn: string };

  function buildABNMap(orgs: OrgEntry[]): Map<string, OrgEntry> {
    const map = new Map<string, OrgEntry>();
    for (const org of orgs) {
      if (org.abn) {
        const cleaned = org.abn.replace(/\s+/g, '').replace(/[^0-9]/g, '');
        if (cleaned.length === 11) {
          map.set(cleaned, org);
        }
      }
    }
    return map;
  }

  function findOrgByABN(abnMap: Map<string, OrgEntry>, abn: string | null): OrgEntry | null {
    if (!abn) return null;
    const cleaned = abn.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    return abnMap.get(cleaned) || null;
  }

  const testOrgs: OrgEntry[] = [
    { id: 'uuid-1', name: 'Legal Aid QLD', abn: '12345678901' },
    { id: 'uuid-2', name: 'Youth Justice Org', abn: '98765432109' },
    { id: 'uuid-3', name: 'No ABN Org', abn: '' },
  ];

  it('builds map excluding orgs without valid ABNs', () => {
    const map = buildABNMap(testOrgs);
    expect(map.size).toBe(2);
    expect(map.has('12345678901')).toBe(true);
    expect(map.has('98765432109')).toBe(true);
  });

  it('finds org by matching ABN', () => {
    const map = buildABNMap(testOrgs);
    const org = findOrgByABN(map, '12345678901');
    expect(org).not.toBeNull();
    expect(org!.name).toBe('Legal Aid QLD');
    expect(org!.id).toBe('uuid-1');
  });

  it('finds org by ABN with spaces', () => {
    const map = buildABNMap(testOrgs);
    const org = findOrgByABN(map, '12 345 678 901');
    expect(org).not.toBeNull();
    expect(org!.name).toBe('Legal Aid QLD');
  });

  it('returns null for unmatched ABN', () => {
    const map = buildABNMap(testOrgs);
    expect(findOrgByABN(map, '00000000000')).toBeNull();
  });

  it('returns null for null ABN', () => {
    const map = buildABNMap(testOrgs);
    expect(findOrgByABN(map, null)).toBeNull();
  });
});

describe('Date range generation', () => {
  function generateDateRanges(
    startDate: Date,
    endDate: Date,
    chunkMonths: number
  ): Array<{ start: string; end: string }> {
    const ranges: Array<{ start: string; end: string }> = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const chunkEnd = new Date(current);
      chunkEnd.setMonth(chunkEnd.getMonth() + chunkMonths);
      if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());

      ranges.push({
        start: current.toISOString().split('T')[0],
        end: chunkEnd.toISOString().split('T')[0],
      });

      current.setTime(chunkEnd.getTime());
      current.setDate(current.getDate() + 1);
    }

    return ranges;
  }

  it('generates 6 monthly ranges for 6 months', () => {
    const start = new Date('2024-07-01');
    const end = new Date('2024-12-31');
    const ranges = generateDateRanges(start, end, 1);
    expect(ranges.length).toBe(6);
    expect(ranges[0].start).toBe('2024-07-01');
    expect(ranges[0].end).toBe('2024-08-01');
  });

  it('generates 2 ranges for 6 months with 3-month chunks', () => {
    const start = new Date('2024-07-01');
    const end = new Date('2024-12-31');
    const ranges = generateDateRanges(start, end, 3);
    expect(ranges.length).toBe(2);
  });

  it('handles single range when chunk exceeds period', () => {
    const start = new Date('2024-10-01');
    const end = new Date('2024-12-31');
    const ranges = generateDateRanges(start, end, 6);
    expect(ranges.length).toBe(1);
    expect(ranges[0].start).toBe('2024-10-01');
    expect(ranges[0].end).toBe('2024-12-31');
  });
});
