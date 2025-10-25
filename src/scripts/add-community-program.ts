/**
 * Interactive script to add a new community program to the database
 *
 * Usage:
 * npm run add-program
 * or
 * DOTENV_CONFIG_PATH=.env.local NODE_OPTIONS='--require dotenv/config' npx tsx src/scripts/add-community-program.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.YJSF_SUPABASE_SERVICE_KEY || '' // Use service key for write access
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function addProgram() {
  console.log('\n🌟 ADD NEW COMMUNITY PROGRAM\n');
  console.log('━'.repeat(60));
  console.log('Let\'s add a new program! I\'ll ask you some questions.\n');

  try {
    // Basic Information
    console.log('📋 BASIC INFORMATION\n');

    const name = await question('Program Name: ');
    if (!name) throw new Error('Program name is required');

    const organization = await question('Organization: ');
    if (!organization) throw new Error('Organization is required');

    const location = await question('Location (city/town): ');
    if (!location) throw new Error('Location is required');

    console.log('\nAvailable states: NSW, VIC, QLD, SA, WA, TAS, NT, ACT');
    const state = await question('State: ').then(s => s.toUpperCase());
    if (!['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'].includes(state)) {
      throw new Error('Invalid state');
    }

    // Categorization
    console.log('\n🏷️  CATEGORIZATION\n');
    console.log('Approach types:');
    console.log('  1. Indigenous-led');
    console.log('  2. Community-based');
    console.log('  3. Grassroots');
    console.log('  4. Culturally-responsive\n');

    const approachNum = await question('Select approach (1-4): ');
    const approaches = ['Indigenous-led', 'Community-based', 'Grassroots', 'Culturally-responsive'];
    const approach = approaches[parseInt(approachNum) - 1];
    if (!approach) throw new Error('Invalid approach selection');

    const indigenousKnowledgeStr = await question('Uses Indigenous knowledge? (yes/no): ');
    const indigenous_knowledge = indigenousKnowledgeStr.toLowerCase() === 'yes';

    const isFeaturedStr = await question('Feature this program? (yes/no): ');
    const is_featured = isFeaturedStr.toLowerCase() === 'yes';

    // Description
    console.log('\n📝 DESCRIPTION\n');

    const description = await question('Description (1-2 sentences): ');
    if (!description) throw new Error('Description is required');

    const impact_summary = await question('Impact summary (one powerful line): ');
    if (!impact_summary) throw new Error('Impact summary is required');

    const tagsStr = await question('Tags (comma-separated, e.g., "Youth Leadership, Mentorship"): ');
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

    // Metrics
    console.log('\n📊 METRICS (press Enter to skip optional ones)\n');

    const successRateStr = await question('Success rate (0-100, or press Enter to skip): ');
    const success_rate = successRateStr ? parseInt(successRateStr) : null;

    const participantsStr = await question('Participants served (number, or press Enter to skip): ');
    const participants_served = participantsStr ? parseInt(participantsStr) : null;

    const yearsStr = await question('Years operating (number, or press Enter to skip): ');
    const years_operating = yearsStr ? parseInt(yearsStr) : null;

    const foundedStr = await question('Founded year (e.g., 2015, or press Enter to skip): ');
    const founded_year = foundedStr ? parseInt(foundedStr) : null;

    const scoreStr = await question('Community connection score (0-100, or press Enter to skip): ');
    const community_connection_score = scoreStr ? parseInt(scoreStr) : null;

    // Contact Information
    console.log('\n📞 CONTACT INFO (optional - press Enter to skip)\n');

    const contact_phone = await question('Phone: ');
    const contact_email = await question('Email: ');
    const website = await question('Website: ');

    // Summary
    console.log('\n━'.repeat(60));
    console.log('📋 PROGRAM SUMMARY\n');
    console.log(`Name: ${name}`);
    console.log(`Organization: ${organization}`);
    console.log(`Location: ${location}, ${state}`);
    console.log(`Approach: ${approach}`);
    console.log(`Indigenous Knowledge: ${indigenous_knowledge ? 'Yes' : 'No'}`);
    console.log(`Featured: ${is_featured ? 'Yes' : 'No'}`);
    console.log(`Description: ${description}`);
    console.log(`Impact: ${impact_summary}`);
    if (tags.length > 0) console.log(`Tags: ${tags.join(', ')}`);
    if (success_rate) console.log(`Success Rate: ${success_rate}%`);
    if (participants_served) console.log(`Participants: ${participants_served}`);
    if (years_operating) console.log(`Years Operating: ${years_operating}`);
    if (founded_year) console.log(`Founded: ${founded_year}`);
    if (community_connection_score) console.log(`Community Score: ${community_connection_score}`);
    if (contact_phone) console.log(`Phone: ${contact_phone}`);
    if (contact_email) console.log(`Email: ${contact_email}`);
    if (website) console.log(`Website: ${website}`);
    console.log('\n━'.repeat(60));

    const confirm = await question('\nAdd this program? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Program not added.');
      rl.close();
      return;
    }

    // Insert into database
    console.log('\n💾 Saving to database...');

    const { data, error } = await supabase
      .from('community_programs')
      .insert({
        name,
        organization,
        location,
        state,
        approach,
        indigenous_knowledge,
        is_featured,
        description,
        impact_summary,
        tags,
        success_rate,
        participants_served,
        years_operating,
        founded_year,
        community_connection_score,
        contact_phone: contact_phone || null,
        contact_email: contact_email || null,
        website: website || null
      })
      .select()
      .single();

    if (error) {
      console.log('\n❌ Error saving program:', error.message);
      console.log('\nMake sure you have:');
      console.log('1. Created the database table (run the migration)');
      console.log('2. Set YJSF_SUPABASE_SERVICE_KEY in .env.local');
    } else {
      console.log('\n✅ Program added successfully!');
      console.log(`\nProgram ID: ${data.id}`);
      console.log(`View at: http://localhost:3003/community-programs`);
    }

  } catch (error: any) {
    console.log('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
addProgram();
