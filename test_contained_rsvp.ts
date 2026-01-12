
import { getGHLClient } from './src/lib/ghl/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifyGhlWorkflow() {
    const timestamp = Date.now();
    // using a dynamic alias to ensure NEW contact creation
    const testEmail = `benjamin+test.${timestamp}@act.place`;
    const testName = 'Benjamin Knight';
    const triggerTag = 'CONTAINED Launch 2026';

    console.log('🧪 Starting GHL Workflow Verification');
    console.log(`👤 Creating NEW User: ${testEmail}`);
    console.log(`🏷️  Applying Tag: "${triggerTag}"`);

    const ghl = getGHLClient();

    if (!ghl.isConfigured()) {
        console.error('❌ GHL Client not configured');
        return;
    }

    try {
        const tags = [
            'Event Registrant',
            'Seeds: JusticeHub',
            triggerTag
        ];

        // This call now includes the "addTags" fix I made in client.ts
        const contactId = await ghl.upsertContact({
            email: testEmail,
            name: testName,
            tags: tags,
            source: 'Verification Script'
        });

        if (!contactId) {
            throw new Error('Failed to create contact in GHL');
        }
        console.log(`✅ Contact upserted (ID: ${contactId})`);

        console.log('⏳ Waiting 60 seconds for GHL Workflow (Latency Check)...');
        await new Promise(r => setTimeout(r, 60000));

        console.log('💼 Checking for Pipeline Opportunity...');
        const opportunities = await ghl.getOpportunities(contactId);

        if (opportunities.length > 0) {
            console.log(`🎉 SUCCESS! Found ${opportunities.length} opportunity.`);
            opportunities.forEach(op => {
                console.log(`   - Pipeline ID: ${op.pipelineId}`);
                console.log(`   - Stage ID: ${op.stageId}`);
                console.log(`   - Status: ${op.status}`);
            });
        } else {
            console.error('❌ No Opportunity found.');

            // Debug tags
            const details = await ghl.getAllContacts(testEmail);
            const me = details.find(c => c.email.toLowerCase() === testEmail.toLowerCase());
            console.log('Start Debug: Current Tags on user:', me?.tags);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

verifyGhlWorkflow();
