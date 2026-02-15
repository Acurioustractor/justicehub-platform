import { getGHLClient } from '@/lib/ghl/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugTags() {
    const ghl = getGHLClient();

    console.log('🔍 Fetching first 10 contacts to inspect tags...');

    // Fetch without query to get general list (if API supports empty query or different endpoint)
    // GHL search often allows empty query or just limit.
    // Using query='a' as a hack if empty not allowed, or just raw fetch.
    // Let's try to query generic common letter or just no query.

    try {
        const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${process.env.GHL_LOCATION_ID}&limit=1`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.GHL_API_KEY}`,
                'Content-Type': 'application/json',
                Version: '2021-07-28',
            },
        });

        const data = await response.json();
        console.log('API Response Keys:', Object.keys(data));
        if (data.meta) {
            console.log('Meta:', data.meta);
        }

    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugTags();
