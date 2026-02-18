import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { callItOutSchema } from '@/lib/validation';
import {
  sanitizeInput,
  sanitizeEmail,
  containsXssPatterns,
  checkRateLimit,
} from '@/lib/security';
import { resolveSA3, stateFromPostcode } from '@/lib/sa3-lookup';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per 10 minutes per IP
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(`reports:${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many reports submitted. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const parsed = callItOutSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Invalid form data' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Sanitize text inputs
    const sanitizedSuburb = data.suburb
      ? sanitizeInput(data.suburb, { maxLength: 200, allowNewlines: false })
      : null;
    const sanitizedDescription = data.description
      ? sanitizeInput(data.description, { maxLength: 2000 })
      : null;
    const sanitizedEmail = data.contactEmail
      ? sanitizeEmail(data.contactEmail)
      : null;

    // XSS check on description
    if (sanitizedDescription && containsXssPatterns(sanitizedDescription)) {
      console.warn('Potential XSS attempt in discrimination report');
    }

    // Resolve SA3 region from postcode/state
    const postcode = data.postcode || null;
    const state = data.state || (postcode ? stateFromPostcode(postcode) : null);
    const sa3Code = resolveSA3(postcode || undefined, state || undefined);

    const supabase = createServiceClient();

    const { data: report, error } = await supabase
      .from('discrimination_reports')
      .insert({
        system_type: data.systemType,
        suburb: sanitizedSuburb,
        postcode: postcode,
        state: state,
        sa3_code: sa3Code,
        description: sanitizedDescription,
        incident_date: data.incidentDate || null,
        contact_email: sanitizedEmail,
        consent_to_aggregate: true, // Schema enforces this is true
        status: 'pending',
      })
      .select('id, sa3_code')
      .single();

    if (error) {
      console.error('Error saving discrimination report:', error.code, error.message);
      return NextResponse.json(
        { error: 'Failed to save report. Please try again.' },
        { status: 500 }
      );
    }

    // Fetch region report count for success message
    let regionCount = 0;
    let regionName = '';
    if (sa3Code) {
      const { data: totals } = await supabase
        .from('discrimination_sa3_totals_v')
        .select('total_reports, sa3_name')
        .eq('sa3_code', sa3Code)
        .single();

      if (totals) {
        regionCount = totals.total_reports;
        regionName = totals.sa3_name;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your report has been submitted and will be reviewed. Thank you for speaking up.',
      reportId: report?.id,
      region: regionName || null,
      regionCount,
    });
  } catch (error) {
    console.error(
      'Reports API error:',
      error instanceof Error ? error.message : 'Unknown'
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
