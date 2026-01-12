import { NextRequest, NextResponse } from 'next/server';
import { enrichmentService } from '@/services/enrichment';
import { getGHLClient } from '@/lib/ghl/client';

export async function POST(request: NextRequest) {
    try {
        const { email, name, organization, ghlContactId } = await request.json();

        if (!name || !organization) {
            return NextResponse.json(
                { error: 'Name and Organization are required for enrichment' },
                { status: 400 }
            );
        }

        // 1. Enrich Data
        const enrichedData = await enrichmentService.enrichContact(name, organization);

        if (!enrichedData) {
            return NextResponse.json({ message: 'No enrichment data found' });
        }

        // 2. Update GHL if contact ID provided
        if (ghlContactId) {
            const ghl = getGHLClient();
            await ghl.updateContact(ghlContactId, {
                customFields: {
                    bio: enrichedData.summary,
                    linkedin_url: enrichedData.linkedInUrl || '',
                    key_interests: enrichedData.keyInterests.join(', '),
                },
                tags: enrichedData.suggestedTags
            });
        }

        return NextResponse.json({ success: true, data: enrichedData });

    } catch (error: any) {
        console.error('Enrichment API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
