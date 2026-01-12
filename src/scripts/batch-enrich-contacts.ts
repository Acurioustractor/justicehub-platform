/**
 * Batch Enrich GHL Contacts
 * 
 * Usage: npx tsx src/scripts/batch-enrich-contacts.ts [tag]
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function batchEnrich() {
    // Dynamic imports to ensure env vars are loaded first
    const { getGHLClient, GHL_TAGS } = await import('@/lib/ghl/client');
    const { enrichmentService } = await import('@/services/enrichment');

    const ghl = getGHLClient();

    // Allow passing tag as argument. If "ALL", fetch everything.
    const targetTag = process.argv[2];

    if (!ghl.isConfigured()) {
        console.error('❌ GHL Client not configured');
        process.exit(1);
    }

    let contacts;
    if (!targetTag || targetTag === 'ALL') {
        console.log('🔍 Fetching ALL contacts (Pagination enabled)...');
        contacts = await ghl.getAllContacts();
    } else {
        console.log('🔍 Fetching contacts with tag:', targetTag);
        contacts = await ghl.getContactsByTag(targetTag);
    }

    console.log(`✅ Found ${contacts.length} total contacts.`);

    let enrichedCount = 0;
    let skippedCount = 0;

    for (const contact of contacts) {
        // 2. Filter: If a specific tag was requested, double check it here
        if (targetTag && targetTag !== 'ALL') {
            if (contact.tags && !contact.tags.some(t => t.toLowerCase() === targetTag.toLowerCase())) {
                // Check if loose match for 'justicehub' might be acceptable, but strict is safer
                // console.log(`⏩ Skipping (Tag Mismatch)`);
                skippedCount++;
                continue;
            }
        }
        if (contact.tags?.includes('Data Enriched')) {
            console.log(`⏩ Skipping ${contact.firstName} ${contact.lastName} (Already Enriched)`);
            skippedCount++;
            continue;
        }

        console.log(`\n🧪 Enriching: ${contact.firstName} ${contact.lastName} (${contact.email})...`);

        // 3. Enrich
        // Note: We need organization. GHL often stores this in 'companyName' or a custom field.
        // We'll try to guess it or use a default if missing, or skip.

        let organization = 'JusticeHub'; // Default context for this list
        if (contact.customFields?.organization) {
            organization = contact.customFields.organization;
        } else if (contact.customFields?.['company_name']) {
            organization = contact.customFields['company_name'];
        }

        const enriched = await enrichmentService.enrichContact(
            `${contact.firstName} ${contact.lastName}`,
            organization
        );

        if (enriched) {
            // 4. Update GHL
            await ghl.updateContact(contact.id!, {
                customFields: {
                    bio: enriched.summary,
                    linkedin_url: enriched.linkedInUrl || '',
                    key_interests: enriched.keyInterests.join(', '),
                },
                tags: [...(contact.tags || []), ...enriched.suggestedTags, 'Data Enriched']
            });
            console.log(`✅ Updated ${contact.firstName}: ${enriched.currentRole}`);
            enrichedCount++;
        } else {
            console.log(`❌ No data found for ${contact.firstName}`);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n' + '='.repeat(30));
    console.log(`Batch Complete.`);
    console.log(`Enriched: ${enrichedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

batchEnrich();
