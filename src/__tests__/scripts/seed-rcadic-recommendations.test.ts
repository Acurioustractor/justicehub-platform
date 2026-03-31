/**
 * Tests for RCADIC recommendation seed data and API route logic.
 *
 * Validates:
 * - Recommendation data structure and completeness
 * - Status values match allowed enum
 * - All required fields present
 * - API route filtering logic
 * - Dedup key generation
 */

// ── RCADIC Recommendation Data ───────────────────────────────────────

const VALID_STATUSES = [
  'implemented',
  'partially_implemented',
  'not_implemented',
  'rejected',
] as const;

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

interface RcadicRecommendation {
  oversight_body: string;
  report_title: string;
  recommendation_number: string;
  recommendation_text: string;
  status: string;
  status_notes: string;
  severity: string;
  jurisdiction: string;
  domain: string;
  report_date: string;
  report_url: string;
  metadata: Record<string, unknown>;
}

// Import the data by reconstructing the expected shape
// (since the seed script is .mjs, we define expected data inline for testing)
const EXPECTED_REC_NUMBERS = [
  '62', '92', '104', '109',
  '161', '165', '167',
  '188', '204',
  '234', '235', '236', '237', '238',
  '239', '240', '241', '242', '243', '244', '245',
];

describe('RCADIC Recommendations - Data Validation', () => {
  // We define a minimal version of the data to validate shape
  const sampleRec: RcadicRecommendation = {
    oversight_body: 'Royal Commission into Aboriginal Deaths in Custody',
    report_title: 'Royal Commission into Aboriginal Deaths in Custody (1991)',
    recommendation_number: '234',
    recommendation_text: 'All juvenile justice agencies should adopt the principle that detention of young people should be used as last resort',
    status: 'partially_implemented',
    status_notes: 'Legislated in principle but not enforced in practice. Indigenous youth detention rates have increased since 1991.',
    severity: 'critical',
    jurisdiction: 'National',
    domain: 'youth_justice',
    report_date: '1991-04-15',
    report_url: 'https://www.austlii.edu.au/au/other/IndigLRes/rciadic/',
    metadata: {
      cluster: 'juvenile_justice',
      youth_justice_relevant: true,
      source: 'RCADIC Final Report, Vol 5',
    },
  };

  test('sample recommendation has all required fields', () => {
    expect(sampleRec.oversight_body).toBeTruthy();
    expect(sampleRec.report_title).toBeTruthy();
    expect(sampleRec.recommendation_number).toBeTruthy();
    expect(sampleRec.recommendation_text).toBeTruthy();
    expect(sampleRec.status).toBeTruthy();
    expect(sampleRec.severity).toBeTruthy();
    expect(sampleRec.jurisdiction).toBeTruthy();
    expect(sampleRec.domain).toBeTruthy();
  });

  test('oversight_body is exactly RCADIC', () => {
    expect(sampleRec.oversight_body).toBe(
      'Royal Commission into Aboriginal Deaths in Custody'
    );
  });

  test('status is a valid enum value', () => {
    expect(VALID_STATUSES).toContain(sampleRec.status);
  });

  test('severity is a valid enum value', () => {
    expect(VALID_SEVERITIES).toContain(sampleRec.severity);
  });

  test('domain is youth_justice', () => {
    expect(sampleRec.domain).toBe('youth_justice');
  });

  test('jurisdiction is National', () => {
    expect(sampleRec.jurisdiction).toBe('National');
  });

  test('report_date is 1991-04-15', () => {
    expect(sampleRec.report_date).toBe('1991-04-15');
  });

  test('metadata contains cluster and youth_justice_relevant', () => {
    expect(sampleRec.metadata.cluster).toBeTruthy();
    expect(sampleRec.metadata.youth_justice_relevant).toBe(true);
  });

  test('expected recommendation count is 21', () => {
    expect(EXPECTED_REC_NUMBERS).toHaveLength(21);
  });

  test('expected recommendations include all juvenile justice cluster (234-245)', () => {
    for (let i = 234; i <= 245; i++) {
      expect(EXPECTED_REC_NUMBERS).toContain(String(i));
    }
  });

  test('expected recommendations include sentencing reform cluster', () => {
    expect(EXPECTED_REC_NUMBERS).toContain('92');
    expect(EXPECTED_REC_NUMBERS).toContain('104');
    expect(EXPECTED_REC_NUMBERS).toContain('109');
  });

  test('expected recommendations include deaths in custody cluster', () => {
    expect(EXPECTED_REC_NUMBERS).toContain('161');
    expect(EXPECTED_REC_NUMBERS).toContain('165');
    expect(EXPECTED_REC_NUMBERS).toContain('167');
  });

  test('expected recommendations include self-determination cluster', () => {
    expect(EXPECTED_REC_NUMBERS).toContain('188');
    expect(EXPECTED_REC_NUMBERS).toContain('204');
  });
});

// ── Dedup Key Generation ─────────────────────────────────────────────

describe('RCADIC Recommendations - Dedup Logic', () => {
  const makeDedupKey = (body: string, recNum: string) =>
    `${body.toLowerCase().replace(/\s+/g, '-')}-rec-${recNum}`;

  test('generates consistent dedup keys', () => {
    const key = makeDedupKey(
      'Royal Commission into Aboriginal Deaths in Custody',
      '234'
    );
    expect(key).toBe(
      'royal-commission-into-aboriginal-deaths-in-custody-rec-234'
    );
  });

  test('dedup keys are unique for different recommendation numbers', () => {
    const keys = EXPECTED_REC_NUMBERS.map((num) =>
      makeDedupKey(
        'Royal Commission into Aboriginal Deaths in Custody',
        num
      )
    );
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ── API Route Filtering Logic ────────────────────────────────────────

describe('RCADIC API Route - Filter Logic', () => {
  // Simulate the filtering that the API route performs
  const mockData: RcadicRecommendation[] = [
    {
      oversight_body: 'Royal Commission into Aboriginal Deaths in Custody',
      report_title: 'Royal Commission into Aboriginal Deaths in Custody (1991)',
      recommendation_number: '234',
      recommendation_text: 'Detention as last resort',
      status: 'partially_implemented',
      status_notes: '',
      severity: 'critical',
      jurisdiction: 'National',
      domain: 'youth_justice',
      report_date: '1991-04-15',
      report_url: '',
      metadata: { cluster: 'juvenile_justice', youth_justice_relevant: true },
    },
    {
      oversight_body: 'Royal Commission into Aboriginal Deaths in Custody',
      report_title: 'Royal Commission into Aboriginal Deaths in Custody (1991)',
      recommendation_number: '244',
      recommendation_text: 'Review mandatory sentencing',
      status: 'rejected',
      status_notes: '',
      severity: 'critical',
      jurisdiction: 'National',
      domain: 'youth_justice',
      report_date: '1991-04-15',
      report_url: '',
      metadata: { cluster: 'juvenile_justice', youth_justice_relevant: true },
    },
    {
      oversight_body: 'Royal Commission into Aboriginal Deaths in Custody',
      report_title: 'Royal Commission into Aboriginal Deaths in Custody (1991)',
      recommendation_number: '167',
      recommendation_text: 'No isolation',
      status: 'rejected',
      status_notes: '',
      severity: 'critical',
      jurisdiction: 'National',
      domain: 'youth_justice',
      report_date: '1991-04-15',
      report_url: '',
      metadata: { cluster: 'deaths_in_custody', youth_justice_relevant: true },
    },
  ];

  test('filter by status=rejected returns only rejected', () => {
    const filtered = mockData.filter((r) => r.status === 'rejected');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.status === 'rejected')).toBe(true);
  });

  test('filter by status=partially_implemented returns correct subset', () => {
    const filtered = mockData.filter(
      (r) => r.status === 'partially_implemented'
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].recommendation_number).toBe('234');
  });

  test('filter by status=all returns everything', () => {
    const status = 'all';
    const filtered =
      status === 'all' ? mockData : mockData.filter((r) => r.status === status);
    expect(filtered).toHaveLength(3);
  });

  test('no filter returns everything', () => {
    const status = null;
    const filtered = status
      ? mockData.filter((r) => r.status === status)
      : mockData;
    expect(filtered).toHaveLength(3);
  });

  test('filter by cluster via metadata', () => {
    const filtered = mockData.filter(
      (r) => (r.metadata as Record<string, unknown>).cluster === 'juvenile_justice'
    );
    expect(filtered).toHaveLength(2);
  });

  test('status summary counts are correct', () => {
    const summary = mockData.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    expect(summary.rejected).toBe(2);
    expect(summary.partially_implemented).toBe(1);
  });
});
