/**
 * Tests for government API enrichment utilities
 *
 * Tests the pure functions used by scripts/enrich-from-apis.mjs:
 * - ABR XML parsing
 * - SEIFA postcode lookup
 * - OpenSanctions fuzzy name matching
 * - JSONB merge construction
 */

import {
  parseAbrXml,
  buildAbrValidation,
  buildSeifaData,
  fuzzyNameMatch,
  buildPepScreening,
  buildJsonbMerge,
  extractPostcode,
} from '@/lib/enrichment/gov-api-utils';

// ────────────────────────────────────────────────────────────────
// ABR XML Parsing
// ────────────────────────────────────────────────────────────────

describe('parseAbrXml', () => {
  const SAMPLE_ABR_XML = `<?xml version="1.0" encoding="utf-8"?>
<ABRPayloadSearchResults xmlns="http://abr.business.gov.au/ABRXMLSearch/">
  <request>
    <identifierSearchRequest>
      <authenticationGUID>test-guid</authenticationGUID>
      <identifierType>ABN</identifierType>
      <identifierValue>51824753556</identifierValue>
    </identifierSearchRequest>
  </request>
  <response>
    <dateRegisterLastUpdated>2026-03-14</dateRegisterLastUpdated>
    <dateTimeRetrieved>2026-03-14T10:00:00</dateTimeRetrieved>
    <businessEntity>
      <ABN>
        <identifierValue>51824753556</identifierValue>
        <isCurrentIndicator>Y</isCurrentIndicator>
      </ABN>
      <entityStatus>
        <entityStatusCode>Active</entityStatusCode>
        <effectiveFrom>2001-11-01</effectiveFrom>
      </entityStatus>
      <entityType>
        <entityTypeCode>PUB</entityTypeCode>
        <entityDescription>Australian Public Company</entityDescription>
      </entityType>
      <mainName>
        <organisationName>TEST ORGANISATION LTD</organisationName>
        <effectiveFrom>2001-11-01</effectiveFrom>
      </mainName>
      <mainTradingName>
        <organisationName>TEST ORG</organisationName>
        <effectiveFrom>2010-01-01</effectiveFrom>
      </mainTradingName>
      <mainBusinessPhysicalAddress>
        <stateCode>QLD</stateCode>
        <postcode>4000</postcode>
      </mainBusinessPhysicalAddress>
      <goodsAndServicesTax>
        <effectiveFrom>2000-07-01</effectiveFrom>
      </goodsAndServicesTax>
    </businessEntity>
  </response>
</ABRPayloadSearchResults>`;

  it('extracts entity status from XML', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('Active');
  });

  it('extracts entity type', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result!.entityType).toBe('Australian Public Company');
  });

  it('extracts main name', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result!.mainName).toBe('TEST ORGANISATION LTD');
  });

  it('extracts trading name', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result!.tradingName).toBe('TEST ORG');
  });

  it('extracts state and postcode', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result!.state).toBe('QLD');
    expect(result!.postcode).toBe('4000');
  });

  it('detects GST registration', () => {
    const result = parseAbrXml(SAMPLE_ABR_XML);
    expect(result!.gst).toBe(true);
  });

  it('returns null for invalid XML', () => {
    const result = parseAbrXml('<not-valid>stuff</not-valid>');
    expect(result).toBeNull();
  });

  it('returns null for empty response', () => {
    const result = parseAbrXml('');
    expect(result).toBeNull();
  });

  it('handles Cancelled status', () => {
    const cancelledXml = SAMPLE_ABR_XML.replace('Active', 'Cancelled');
    const result = parseAbrXml(cancelledXml);
    expect(result!.status).toBe('Cancelled');
  });

  it('handles missing trading name', () => {
    const noTrading = SAMPLE_ABR_XML.replace(
      /<mainTradingName>[\s\S]*?<\/mainTradingName>/,
      ''
    );
    const result = parseAbrXml(noTrading);
    expect(result!.tradingName).toBeNull();
  });

  it('handles missing GST section', () => {
    const noGst = SAMPLE_ABR_XML.replace(
      /<goodsAndServicesTax>[\s\S]*?<\/goodsAndServicesTax>/,
      ''
    );
    const result = parseAbrXml(noGst);
    expect(result!.gst).toBe(false);
  });
});

describe('buildAbrValidation', () => {
  it('constructs correct JSONB structure', () => {
    const parsed = {
      status: 'Active',
      entityType: 'Company',
      mainName: 'Test Org',
      tradingName: null,
      state: 'QLD',
      postcode: '4000',
      gst: true,
    };
    const result = buildAbrValidation(parsed);
    expect(result).toEqual({
      abr_validation: {
        status: 'Active',
        entity_type: 'Company',
        state: 'QLD',
        postcode: '4000',
        gst: true,
        validated_at: expect.any(String),
      },
    });
  });

  it('includes ISO date string in validated_at', () => {
    const parsed = {
      status: 'Active',
      entityType: 'Company',
      mainName: 'Test',
      tradingName: null,
      state: 'NSW',
      postcode: '2000',
      gst: false,
    };
    const result = buildAbrValidation(parsed);
    // Should be YYYY-MM-DD format
    expect(result.abr_validation.validated_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ────────────────────────────────────────────────────────────────
// SEIFA
// ────────────────────────────────────────────────────────────────

describe('buildSeifaData', () => {
  it('constructs correct JSONB structure', () => {
    const result = buildSeifaData({
      irsdScore: 950,
      irsdDecile: 3,
      lga: 'Brisbane (C)',
      lgaCode: '31000',
    });
    expect(result).toEqual({
      seifa: {
        irsd_score: 950,
        irsd_decile: 3,
        lga: 'Brisbane (C)',
        lga_code: '31000',
        year: 2021,
      },
    });
  });
});

describe('extractPostcode', () => {
  it('extracts from acnc_data.abr_validation.postcode', () => {
    const org = {
      acnc_data: { abr_validation: { postcode: '4000' } },
    };
    expect(extractPostcode(org)).toBe('4000');
  });

  it('extracts from acnc_data.postcode', () => {
    const org = { acnc_data: { postcode: '2000' } };
    expect(extractPostcode(org)).toBe('2000');
  });

  it('extracts from address string', () => {
    const org = { acnc_data: { address: '123 Main St, Brisbane QLD 4000' } };
    expect(extractPostcode(org)).toBe('4000');
  });

  it('returns null when no postcode found', () => {
    const org = { acnc_data: {} };
    expect(extractPostcode(org)).toBeNull();
  });

  it('returns null for null acnc_data', () => {
    const org = { acnc_data: null };
    expect(extractPostcode(org)).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────
// OpenSanctions Fuzzy Matching
// ────────────────────────────────────────────────────────────────

describe('fuzzyNameMatch', () => {
  it('returns high confidence for exact match', () => {
    const result = fuzzyNameMatch('John Smith', 'John Smith');
    expect(result).toBeGreaterThanOrEqual(0.95);
  });

  it('returns high confidence for case-insensitive match', () => {
    const result = fuzzyNameMatch('john smith', 'JOHN SMITH');
    expect(result).toBeGreaterThanOrEqual(0.95);
  });

  it('handles reversed name order', () => {
    const result = fuzzyNameMatch('Smith, John', 'John Smith');
    expect(result).toBeGreaterThanOrEqual(0.8);
  });

  it('returns low confidence for partial match', () => {
    const result = fuzzyNameMatch('John', 'John Smith');
    expect(result).toBeLessThan(0.8);
  });

  it('returns 0 for completely different names', () => {
    const result = fuzzyNameMatch('Alice Johnson', 'Bob Williams');
    expect(result).toBeLessThan(0.3);
  });

  it('handles middle names gracefully', () => {
    const result = fuzzyNameMatch('John Robert Smith', 'John Smith');
    expect(result).toBeGreaterThanOrEqual(0.6);
  });

  it('handles empty strings', () => {
    expect(fuzzyNameMatch('', 'John')).toBe(0);
    expect(fuzzyNameMatch('John', '')).toBe(0);
  });
});

describe('buildPepScreening', () => {
  it('constructs correct JSONB structure', () => {
    const matches = [
      { person: 'John Smith', pep_role: 'Member of Parliament', confidence: 0.95 },
    ];
    const result = buildPepScreening(matches);
    expect(result).toEqual({
      pep_screening: {
        matches: [{ person: 'John Smith', pep_role: 'Member of Parliament', confidence: 0.95 }],
        screened_at: expect.any(String),
        pep_count: 1,
      },
    });
  });

  it('handles empty matches', () => {
    const result = buildPepScreening([]);
    expect(result.pep_screening.pep_count).toBe(0);
    expect(result.pep_screening.matches).toEqual([]);
  });

  it('counts multiple matches', () => {
    const matches = [
      { person: 'A', pep_role: 'MP', confidence: 0.9 },
      { person: 'B', pep_role: 'Senator', confidence: 0.85 },
    ];
    const result = buildPepScreening(matches);
    expect(result.pep_screening.pep_count).toBe(2);
  });
});

// ────────────────────────────────────────────────────────────────
// JSONB Merge
// ────────────────────────────────────────────────────────────────

describe('buildJsonbMerge', () => {
  it('merges new data into existing JSONB', () => {
    const existing = { foo: 'bar' };
    const newData = { abr_validation: { status: 'Active' } };
    const result = buildJsonbMerge(existing, newData);
    expect(result).toEqual({
      foo: 'bar',
      abr_validation: { status: 'Active' },
    });
  });

  it('handles null existing data', () => {
    const newData = { abr_validation: { status: 'Active' } };
    const result = buildJsonbMerge(null, newData);
    expect(result).toEqual({ abr_validation: { status: 'Active' } });
  });

  it('handles undefined existing data', () => {
    const newData = { seifa: { irsd_score: 950 } };
    const result = buildJsonbMerge(undefined, newData);
    expect(result).toEqual({ seifa: { irsd_score: 950 } });
  });

  it('overwrites existing keys', () => {
    const existing = { abr_validation: { status: 'Cancelled' } };
    const newData = { abr_validation: { status: 'Active' } };
    const result = buildJsonbMerge(existing, newData);
    expect(result.abr_validation.status).toBe('Active');
  });

  it('preserves unrelated keys', () => {
    const existing = { seifa: { irsd_score: 950 }, abr_validation: { status: 'Active' } };
    const newData = { pep_screening: { pep_count: 1 } };
    const result = buildJsonbMerge(existing, newData);
    expect(result.seifa).toBeDefined();
    expect(result.abr_validation).toBeDefined();
    expect(result.pep_screening).toBeDefined();
  });
});
