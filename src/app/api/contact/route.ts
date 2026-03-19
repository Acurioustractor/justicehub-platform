import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-lite';
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  containsXssPatterns,
} from '@/lib/security';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';
import { sendEmail } from '@/lib/email/send';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: string;
  message: string;
  organization?: string;
  organization_id?: string;
}

// Allowed categories to prevent injection via category field
const ALLOWED_CATEGORIES = [
  'general',
  'support',
  'partnership',
  'media',
  'feedback',
  'technical',
  'contained-help',
  'other',
];

// Map contact categories to GHL tags
const CATEGORY_TAGS: Record<string, string> = {
  partnership: 'Partnership Inquiry',
  media: 'Media Inquiry',
  support: 'Support Request',
  'contained-help': 'contained-2026-launch',
};

// Map help form selections to specific GHL tags
const HELP_OPTION_TAGS: Record<string, string> = {
  'host': 'CONTAINED Host Interest',
  'fund': 'CONTAINED Funder Interest',
  'young-people': 'CONTAINED Youth Voice Connector',
  'community-org': 'CONTAINED Org Connector',
  'spread': 'CONTAINED Amplifier',
  'partner': 'Partnership Inquiry',
};

/**
 * Extract help option IDs from the subject line (format: "[CONTAINED] label1, label2")
 */
function extractHelpTags(subject: string | null): string[] {
  if (!subject || !subject.startsWith('[CONTAINED]')) return [];

  const tags: string[] = [];
  const content = subject.replace('[CONTAINED] ', '');

  // Match each help option by its label
  const labelToId: Record<string, string> = {
    'Host the container in my region': 'host',
    'Fund a tour stop': 'fund',
    'I know young people who should help design Room 1': 'young-people',
    'I know a community org for Room 3': 'community-org',
    'Spread the word': 'spread',
    'Partnership': 'partner',
  };

  for (const [label, id] of Object.entries(labelToId)) {
    if (content.includes(label) && HELP_OPTION_TAGS[id]) {
      tags.push(HELP_OPTION_TAGS[id]);
    }
  }

  return tags;
}

/**
 * Sync contact submission to GoHighLevel
 */
async function syncToGHL(
  email: string,
  name: string,
  organization: string | null,
  category: string,
  subject?: string | null
): Promise<void> {
  try {
    const ghl = getGHLClient();
    if (!ghl.isConfigured()) return;

    const tags = ['Contact Form', 'JusticeHub'];

    // Add category-specific tag
    if (CATEGORY_TAGS[category]) {
      tags.push(CATEGORY_TAGS[category]);
    }

    // Add help-option-specific tags for contained-help submissions
    if (category === 'contained-help' && subject) {
      const helpTags = extractHelpTags(subject);
      tags.push(...helpTags);
    }

    await ghl.upsertContact({
      email,
      name,
      tags,
      source: category === 'contained-help' ? 'JusticeHub CONTAINED Help Form' : 'JusticeHub Contact Form',
      customFields: {
        organization: organization || '',
        contact_category: category,
      },
    });
  } catch (err) {
    // Don't fail the request if GHL sync fails
    console.error('GHL sync error (contact form):', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message, and category are required' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(body.email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate category
    const category = body.category.toLowerCase();
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Sanitize all text inputs
    const sanitizedName = sanitizeInput(body.name, { maxLength: 200, allowNewlines: false });
    const sanitizedSubject = body.subject
      ? sanitizeInput(body.subject, { maxLength: 500, allowNewlines: false })
      : null;
    const sanitizedMessage = sanitizeInput(body.message, { maxLength: 5000 });
    const sanitizedOrganization = body.organization
      ? sanitizeInput(body.organization, { maxLength: 200, allowNewlines: false })
      : null;
    const sanitizedPhone = body.phone ? sanitizePhone(body.phone) : null;

    // Check for XSS patterns in message (log for security monitoring)
    if (containsXssPatterns(body.message) || containsXssPatterns(body.name)) {
      console.warn('Potential XSS attempt detected in contact form');
    }

    // Validate sanitized inputs aren't empty
    if (!sanitizedName || !sanitizedMessage) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Validate organization_id format if provided
    const organizationId = body.organization_id && /^[0-9a-f-]{36}$/i.test(body.organization_id)
      ? body.organization_id
      : null;

    // Store the sanitized contact submission in the database
    const { data, error }: { data: any; error: any } = await (supabase as any)
      .from('contact_submissions')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        category: category,
        message: sanitizedMessage,
        organization: sanitizedOrganization,
        organization_id: organizationId,
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log but don't fail - the submission was received
      if (error.code === '42P01') {
        console.log('Contact submissions table does not exist yet');
        // Still sync to GHL even if DB table missing
        await syncToGHL(sanitizedEmail, sanitizedName, sanitizedOrganization, category, sanitizedSubject);
        return NextResponse.json({
          success: true,
          message: 'Thank you for your message. We will get back to you soon.',
        });
      }

      console.error('Error saving contact submission:', error.code);
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      );
    }

    // If org-scoped submission, create an action item in the org's inbox
    if (organizationId && data?.id) {
      const contactDetails = [
        `From: ${sanitizedName} <${sanitizedEmail}>`,
        sanitizedPhone ? `Phone: ${sanitizedPhone}` : null,
        '',
        sanitizedMessage,
      ].filter(Boolean).join('\n');

      await (supabase as any)
        .from('org_action_items')
        .insert({
          organization_id: organizationId,
          item_type: 'inquiry',
          title: `Inquiry from ${sanitizedName}: ${sanitizedSubject || 'General inquiry'}`,
          description: contactDetails,
          priority: 'medium',
          status: 'open',
          source_agent: 'contact_form',
          link_to_table: 'contact_submissions',
          link_to_id: data.id,
        });
    }

    // Sync contact to GoHighLevel
    let ghlSynced = true;
    try {
      await syncToGHL(sanitizedEmail, sanitizedName, sanitizedOrganization, category, sanitizedSubject);
    } catch (ghlErr) {
      console.error('GHL sync failed for contact submission:', data?.id, ghlErr);
      ghlSynced = false;
    }

    // Send thank-you confirmation email
    sendEmail({
      to: sanitizedEmail,
      subject: 'We received your message',
      preheader: "We'll get back to you within 24-48 hours.",
      body: `Hi ${sanitizedName},

Thank you for reaching out to JusticeHub.

We've received your message${sanitizedSubject ? ` regarding "${sanitizedSubject}"` : ''} and will get back to you within 24-48 hours.

In the meantime, you might find these resources helpful:

Explore ALMA: https://justicehub.com.au/intelligence/interventions
THE CONTAINED tour: https://justicehub.com.au/contained

— The JusticeHub Team`,
    }).catch(err => console.error('Failed to send contact confirmation email:', err));

    return NextResponse.json({
      success: true,
      message: ghlSynced
        ? 'Thank you for your message. We will get back to you within 24-48 hours.'
        : 'Thank you for your message. We received it and will get back to you soon.',
      submissionId: data?.id,
    });

  } catch (error) {
    console.error('Contact API error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
