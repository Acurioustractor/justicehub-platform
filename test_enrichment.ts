import { enrichmentService } from './src/services/enrichment';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEnrichment() {
  console.log('🧪 Testing Enrichment Service...');
  
  // Test Case: A known public figure to verify search quality
  const name = 'Ben Knight'; 
  const organization = 'JusticeHub';

  console.log(`\nSearching for: ${name} @ ${organization}`);
  
  try {
    const result = await enrichmentService.enrichContact(name, organization);
    
    if (result) {
      console.log('\n✅ Enrichment Successful!');
      console.log('Summary:', result.summary);
      console.log('Role:', result.currentRole);
      console.log('LinkedIn:', result.linkedInUrl);
      console.log('Interests:', result.keyInterests);
      console.log('Tags:', result.suggestedTags);
    } else {
      console.log('\n❌ No results found.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testEnrichment();
