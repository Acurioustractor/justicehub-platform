import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  containsXssPatterns,
} from '@/lib/security';
import { getGHLClient, GHL_TAGS } from '@/lib/ghl/client';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: string;
  message: string;
  organization?: string;
}

// Allowed categories to prevent injection via category field
const ALLOWED_CATEGORIES = [
  'general',
  'support',
  'partnership',
  'media',
  'feedback',
  'technical',
  'other',
];

// Map contact categories to GHL tags
const CATEGORY_TAGS: Record<string, string> = {
  partnership: 'Partnership Inquiry',
  media: 'Media Inquiry',
  support: 'Support Request',
};

/**
 * Sync contact submission to GoHighLevel
 */
async function syncToGHL(
  email: string,
  name: string,
  organization: string | null,
  category: string
): Promise<void> {
  try {
    const ghl = getGHLClient();
    if (!ghl.isConfigured()) return;

    const tags = ['Contact Form', 'JusticeHub'];

    // Add category-specific tag
    if (CATEGORY_TAGS[category]) {
      tags.push(CATEGORY_TAGS[category]);
    }

    await ghl.upsertContact({
      email,
      name,
      tags,
      source: 'JusticeHub Contact Form',
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

    // Store the sanitized contact submission in the database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        category: category,
        message: sanitizedMessage,
        organization: sanitizedOrganization,
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
        await syncToGHL(sanitizedEmail, sanitizedName, sanitizedOrganization, category);
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

    // Sync contact to GoHighLevel
    await syncToGHL(sanitizedEmail, sanitizedName, sanitizedOrganization, category);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you within 24-48 hours.',
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
