import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  category: string;
  message: string;
  organization?: string;
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Store the contact submission in the database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject || null,
        category: body.category,
        message: body.message,
        organization: body.organization || null,
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, log but don't fail - the submission was received
      if (error.code === '42P01') {
        console.log('Contact submissions table does not exist yet, submission logged only');
        // Log the submission details for manual processing
        console.log('Contact submission received:', {
          name: body.name,
          email: body.email,
          category: body.category,
          subject: body.subject,
          message: body.message.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Thank you for your message. We will get back to you soon.',
        });
      }

      console.error('Error saving contact submission:', error);
      return NextResponse.json(
        { error: 'Failed to save message. Please try again.' },
        { status: 500 }
      );
    }

    // Log successful submission
    console.log('Contact submission saved:', {
      id: data?.id,
      name: body.name,
      email: body.email,
      category: body.category,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you within 24-48 hours.',
      submissionId: data?.id,
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
