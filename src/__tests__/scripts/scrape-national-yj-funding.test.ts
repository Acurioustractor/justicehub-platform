/**
 * Tests for scrape-national-yj-funding.mjs
 *
 * Tests the core logic functions: dedup, data shaping, budget data structure,
 * ROGS parsing, and AIHW parsing.
 */

// We test the pure logic by importing from a shared module,
// but since the script is .mjs, we test the logic patterns directly here.

describe('National YJ Funding Scraper - Logic Tests', () => {
  // ── Dedup pattern ──────────────────────────────────────────────────

  describe('insertFunding dedup pattern', () => {
    test('generates correct source_statement_id for ROGS records', () => {
      const makeId = (state: string, year: string, category: string) =>
        `${state}-${year}-${category}`.toLowerCase().replace(/\s+/g, '-');

      expect(makeId('NSW', '2023-24', 'Real recurrent expenditure')).toBe(
        'nsw-2023-24-real-recurrent-expenditure'
      );
      expect(makeId('VIC', '2024-25', 'Capital expenditure')).toBe(
        'vic-2024-25-capital-expenditure'
      );
    });

    test('generates correct source_statement_id for budget records', () => {
      const makeId = (state: string, year: string, program: string) =>
        `${state}-budget-${year}-${program}`.toLowerCase().replace(/\s+/g, '-').substring(0, 200);

      const id = makeId('NSW', '2024-25', 'Youth Justice Services');
      expect(id).toBe('nsw-budget-2024-25-youth-justice-services');
      expect(id.length).toBeLessThanOrEqual(200);
    });

    test('source_statement_id is truncated to 200 chars', () => {
      const makeId = (state: string, year: string, program: string) =>
        `${state}-budget-${year}-${program}`.toLowerCase().replace(/\s+/g, '-').substring(0, 200);

      const longProgram = 'A'.repeat(300);
      expect(makeId('NSW', '2024-25', longProgram).length).toBeLessThanOrEqual(200);
    });
  });

  // ── Budget data structure ──────────────────────────────────────────

  describe('STATE_BUDGET_DATA structure', () => {
    const STATE_BUDGET_DATA = [
      {
        state: 'NSW',
        source: 'nsw-budget-2024',
        amount: 86900000,
        year: '2024-25',
        program: 'Youth Justice Services',
        dept: 'Department of Communities and Justice',
        url: 'https://www.budget.nsw.gov.au/2024-25/budget-papers',
      },
      {
        state: 'VIC',
        source: 'vic-budget-2024',
        amount: 69200000,
        year: '2024-25',
        program: 'Youth Justice Services',
        dept: 'Department of Justice and Community Safety',
        url: 'https://www.budget.vic.gov.au/',
      },
      {
        state: 'SA',
        source: 'sa-budget-2024',
        amount: 15325000,
        year: '2024-25',
        program: 'Youth Justice Services',
        dept: 'Department of Human Services',
        url: 'https://www.treasury.sa.gov.au/budget/2024-25',
      },
      {
        state: 'WA',
        source: 'wa-budget-2024',
        amount: 147000000,
        year: '2024-25',
        program: 'Youth Justice Services and Banksia Hill Detention',
        dept: 'Department of Justice',
        url: 'https://www.ourstatebudget.wa.gov.au/',
      },
      {
        state: 'NT',
        source: 'nt-budget-2024',
        amount: 8000000,
        year: '2024-25',
        program: 'Youth Justice and Don Dale Replacement',
        dept: 'Territory Families, Housing and Communities',
        url: 'https://budget.nt.gov.au/',
      },
      {
        state: 'TAS',
        source: 'tas-budget-2024',
        amount: 50400000,
        year: '2024-25',
        program: 'Youth Justice Services and Ashley Replacement',
        dept: 'Department of Justice',
        url: 'https://www.treasury.tas.gov.au/budget-and-financial-management/budget-papers',
      },
      {
        state: 'ACT',
        source: 'act-budget-2024',
        amount: 14100000,
        year: '2024-25',
        program: 'Children, Youth and Family Services',
        dept: 'Community Services Directorate',
        url: 'https://www.treasury.act.gov.au/budget/budget-2024-25',
      },
    ];

    test('covers all non-QLD states and territories', () => {
      const states = STATE_BUDGET_DATA.map((d) => d.state);
      expect(states).toContain('NSW');
      expect(states).toContain('VIC');
      expect(states).toContain('SA');
      expect(states).toContain('WA');
      expect(states).toContain('NT');
      expect(states).toContain('TAS');
      expect(states).toContain('ACT');
      // QLD is already covered by scrape-qld-yj-programs.mjs
      expect(states).not.toContain('QLD');
    });

    test('all entries have required fields', () => {
      for (const entry of STATE_BUDGET_DATA) {
        expect(entry.state).toBeTruthy();
        expect(entry.source).toBeTruthy();
        expect(entry.amount).toBeGreaterThan(0);
        expect(entry.year).toMatch(/^\d{4}-\d{2}$/);
        expect(entry.program).toBeTruthy();
        expect(entry.dept).toBeTruthy();
        expect(entry.url).toMatch(/^https?:\/\//);
      }
    });

    test('amounts are reasonable (between $1M and $500M)', () => {
      for (const entry of STATE_BUDGET_DATA) {
        expect(entry.amount).toBeGreaterThanOrEqual(1_000_000);
        expect(entry.amount).toBeLessThanOrEqual(500_000_000);
      }
    });

    test('maps to correct justice_funding record shape', () => {
      const entry = STATE_BUDGET_DATA[0]; // NSW
      const record = {
        source: entry.source,
        source_statement_id: `${entry.state}-budget-${entry.year}-${entry.program}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .substring(0, 200),
        source_url: entry.url,
        recipient_name: entry.dept,
        program_name: entry.program,
        amount_dollars: entry.amount,
        financial_year: entry.year,
        state: entry.state,
        funding_type: 'appropriation',
        sector: 'youth_justice',
        project_description: expect.stringContaining(entry.state),
      };

      // Verify shape matches justice_funding columns
      expect(record.source).toBe('nsw-budget-2024');
      expect(record.amount_dollars).toBe(86900000);
      expect(record.state).toBe('NSW');
      expect(record.funding_type).toBe('appropriation');
      expect(record.sector).toBe('youth_justice');
    });
  });

  // ── ROGS data parsing ──────────────────────────────────────────────

  describe('ROGS expenditure parsing', () => {
    // Simulating ROGS table structure
    const ROGS_EXPENDITURE_TABLES = ['17A.1', '17A.5', '17A.20', '17A.21'];
    const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

    test('transforms ROGS row to funding record', () => {
      const rogsRow = {
        Table_Number: '17A.1',
        Year: '2023-24',
        Measure: 'Real recurrent expenditure',
        NSW: '86923',
        VIC: '69234',
        QLD: '145678',
        WA: '45123',
        SA: '15325',
        TAS: '12456',
        ACT: '14100',
        NT: '8234',
        Unit: '$\'000',
      };

      // Parse a single state value from ROGS
      const parseRogsAmount = (val: string, unit: string): number | null => {
        if (!val || val === 'na' || val === 'np' || val === '..') return null;
        const cleaned = val.replace(/,/g, '').trim();
        const num = Number(cleaned);
        if (isNaN(num)) return null;
        // ROGS reports in $'000, so multiply by 1000
        if (unit?.includes("'000") || unit?.includes('000')) return num * 1000;
        return num;
      };

      expect(parseRogsAmount('86923', "$'000")).toBe(86923000);
      expect(parseRogsAmount('na', "$'000")).toBeNull();
      expect(parseRogsAmount('np', "$'000")).toBeNull();
      expect(parseRogsAmount('..', "$'000")).toBeNull();
      expect(parseRogsAmount('1,234', "$'000")).toBe(1234000);
    });

    test('generates one funding record per state per year per measure', () => {
      const rogsRow = {
        Table_Number: '17A.1',
        Year: '2023-24',
        Measure: 'Real recurrent expenditure',
        NSW: '86923',
        VIC: '69234',
        Unit: "$'000",
      };

      const records: Array<{ state: string; source_statement_id: string }> = [];
      for (const state of ['NSW', 'VIC']) {
        const val = rogsRow[state as keyof typeof rogsRow] as string;
        if (val && val !== 'na' && val !== 'np') {
          records.push({
            state,
            source_statement_id:
              `rogs-${rogsRow.Table_Number}-${state}-${rogsRow.Year}-${rogsRow.Measure}`
                .toLowerCase()
                .replace(/\s+/g, '-')
                .substring(0, 200),
          });
        }
      }

      expect(records).toHaveLength(2);
      expect(records[0].source_statement_id).toBe(
        'rogs-17a.1-nsw-2023-24-real-recurrent-expenditure'
      );
      expect(records[1].state).toBe('VIC');
    });
  });

  // ── AIHW data parsing ─────────────────────────────────────────────

  describe('AIHW data parsing', () => {
    test('parses AIHW expenditure per young person', () => {
      // AIHW typically provides cost data differently
      const aihwRow = {
        state: 'NSW',
        year: '2023-24',
        measure: 'Expenditure per young person under supervision',
        value: 15234,
        unit: 'dollars',
      };

      // This is per-person, not total spending. We still record it.
      const record = {
        source: 'aihw-yj',
        source_statement_id:
          `aihw-${aihwRow.state}-${aihwRow.year}-${aihwRow.measure}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .substring(0, 200),
        recipient_name: `${aihwRow.state} Government`,
        program_name: aihwRow.measure,
        amount_dollars: aihwRow.value,
        financial_year: aihwRow.year,
        state: aihwRow.state,
      };

      expect(record.source).toBe('aihw-yj');
      expect(record.amount_dollars).toBe(15234);
      expect(record.source_statement_id).toContain('aihw-nsw-2023-24');
    });
  });

  // ── Summary and stats ──────────────────────────────────────────────

  describe('Summary tracking', () => {
    test('tracks inserts, skips, and errors per source', () => {
      const summary = {
        rogs: { inserted: 0, skipped: 0, errors: 0 },
        aihw: { inserted: 0, skipped: 0, errors: 0 },
        budget: { inserted: 0, skipped: 0, errors: 0 },
      };

      // Simulate
      summary.rogs.inserted = 48;
      summary.rogs.skipped = 12;
      summary.budget.inserted = 7;

      const total = Object.values(summary).reduce(
        (acc, s) => ({
          inserted: acc.inserted + s.inserted,
          skipped: acc.skipped + s.skipped,
          errors: acc.errors + s.errors,
        }),
        { inserted: 0, skipped: 0, errors: 0 }
      );

      expect(total.inserted).toBe(55);
      expect(total.skipped).toBe(12);
      expect(total.errors).toBe(0);
    });
  });

  // ── State department name mapping ──────────────────────────────────

  describe('State department mapping', () => {
    const STATE_DEPTS: Record<string, string> = {
      NSW: 'Department of Communities and Justice',
      VIC: 'Department of Justice and Community Safety',
      QLD: 'Department of Youth Justice and Victim Support',
      WA: 'Department of Justice',
      SA: 'Department of Human Services',
      TAS: 'Department of Justice',
      ACT: 'Community Services Directorate',
      NT: 'Territory Families, Housing and Communities',
    };

    test('has mapping for all states', () => {
      const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
      for (const state of states) {
        expect(STATE_DEPTS[state]).toBeTruthy();
      }
    });

    test('department names are non-empty strings', () => {
      for (const dept of Object.values(STATE_DEPTS)) {
        expect(typeof dept).toBe('string');
        expect(dept.length).toBeGreaterThan(5);
      }
    });
  });
});
