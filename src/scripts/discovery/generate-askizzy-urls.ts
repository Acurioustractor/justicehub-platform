/**
 * Generate Ask Izzy URL List for Comprehensive Scraping
 *
 * Creates all combinations of categories × locations for systematic scraping
 */

import { writeFileSync } from 'fs';

// Youth justice relevant categories on Ask Izzy
const CATEGORIES = [
  'housing',
  'advice-and-advocacy',
  'support-and-counselling',
  'domestic-and-family-violence-help',
  'health-and-wellbeing',
  'work-learning-and-things-to-do'
];

// Major cities and statewide for all Australian states
const LOCATIONS = [
  // Queensland (9 locations)
  'Brisbane-QLD',
  'Gold-Coast-QLD',
  'Sunshine-Coast-QLD',
  'Townsville-QLD',
  'Cairns-QLD',
  'Toowoomba-QLD',
  'Ipswich-QLD',
  'Logan-City-QLD',
  'Queensland',

  // New South Wales (8 locations)
  'Sydney-NSW',
  'Newcastle-NSW',
  'Wollongong-NSW',
  'Parramatta-NSW',
  'Liverpool-NSW',
  'Penrith-NSW',
  'Blacktown-NSW',
  'New-South-Wales',

  // Victoria (6 locations)
  'Melbourne-VIC',
  'Geelong-VIC',
  'Ballarat-VIC',
  'Bendigo-VIC',
  'Shepparton-VIC',
  'Victoria',

  // South Australia (3 locations)
  'Adelaide-SA',
  'Mount-Gambier-SA',
  'South-Australia',

  // Western Australia (4 locations)
  'Perth-WA',
  'Mandurah-WA',
  'Bunbury-WA',
  'Western-Australia',

  // Tasmania (3 locations)
  'Hobart-TAS',
  'Launceston-TAS',
  'Tasmania',

  // Northern Territory (3 locations)
  'Darwin-NT',
  'Alice-Springs-NT',
  'Northern-Territory',

  // Australian Capital Territory (2 locations)
  'Canberra-ACT',
  'Australian-Capital-Territory'
];

interface URLSet {
  category: string;
  location: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

function generateURLs(): URLSet[] {
  const urls: URLSet[] = [];

  for (const category of CATEGORIES) {
    for (const location of LOCATIONS) {
      const url = `https://askizzy.org.au/${category}/${location}`;

      // Determine priority based on location size
      let priority: 'high' | 'medium' | 'low' = 'medium';

      if (location.includes('Brisbane') || location.includes('Sydney') ||
          location.includes('Melbourne') || location.includes('Perth') ||
          location.includes('Adelaide')) {
        priority = 'high';
      } else if (location.includes('Queensland') || location.includes('New-South-Wales') ||
                 location.includes('Victoria')) {
        priority = 'high';
      } else if (location.includes('Gold-Coast') || location.includes('Newcastle') ||
                 location.includes('Wollongong')) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      urls.push({ category, location, url, priority });
    }
  }

  return urls;
}

function generateReport() {
  const urls = generateURLs();

  const highPriority = urls.filter(u => u.priority === 'high');
  const mediumPriority = urls.filter(u => u.priority === 'medium');
  const lowPriority = urls.filter(u => u.priority === 'low');

  console.log('📊 Ask Izzy URL Generation Report');
  console.log('='.repeat(60));
  console.log(`Total URLs: ${urls.length}`);
  console.log(`High priority: ${highPriority.length} (major cities + statewide)`);
  console.log(`Medium priority: ${mediumPriority.length} (regional cities)`);
  console.log(`Low priority: ${lowPriority.length} (smaller areas)`);
  console.log('');

  console.log('📋 Category Breakdown:');
  CATEGORIES.forEach(cat => {
    const count = urls.filter(u => u.category === cat).length;
    console.log(`  ${cat}: ${count} URLs`);
  });
  console.log('');

  console.log('🗺️ Location Breakdown:');
  console.log(`  Queensland: ${urls.filter(u => u.location.includes('QLD') || u.location.includes('Queensland')).length} URLs`);
  console.log(`  New South Wales: ${urls.filter(u => u.location.includes('NSW') || u.location.includes('New-South-Wales')).length} URLs`);
  console.log(`  Victoria: ${urls.filter(u => u.location.includes('VIC') || u.location.includes('Victoria')).length} URLs`);
  console.log(`  South Australia: ${urls.filter(u => u.location.includes('SA') || u.location.includes('South-Australia')).length} URLs`);
  console.log(`  Western Australia: ${urls.filter(u => u.location.includes('WA') || u.location.includes('Western-Australia')).length} URLs`);
  console.log(`  Tasmania: ${urls.filter(u => u.location.includes('TAS') || u.location.includes('Tasmania')).length} URLs`);
  console.log(`  Northern Territory: ${urls.filter(u => u.location.includes('NT') || u.location.includes('Northern-Territory')).length} URLs`);
  console.log(`  ACT: ${urls.filter(u => u.location.includes('ACT') || u.location.includes('Australian-Capital-Territory')).length} URLs`);
  console.log('');

  console.log('💰 Cost Estimate:');
  console.log(`  Firecrawl: ${urls.length} URLs × $0.002 = $${(urls.length * 0.002).toFixed(2)}`);
  console.log(`  Estimated total: $${(urls.length * 0.003).toFixed(2)} (including extraction)`);
  console.log('');

  console.log('⏱️ Time Estimate:');
  console.log(`  At 1 request/second: ${Math.ceil(urls.length / 60)} minutes`);
  console.log(`  At 1 request/2 seconds: ${Math.ceil(urls.length / 30)} minutes (conservative)`);
  console.log('');

  console.log('📈 Expected Results:');
  console.log(`  Estimated services per URL: 10-50`);
  console.log(`  Total estimated services: ${urls.length * 15} - ${urls.length * 40}`);
  console.log(`  After deduplication (~40%): ${Math.round(urls.length * 15 * 0.6)} - ${Math.round(urls.length * 40 * 0.6)}`);

  return urls;
}

function saveToFile() {
  const urls = generateURLs();

  // Save as JSON
  const jsonData = {
    generated: new Date().toISOString(),
    total_urls: urls.length,
    categories: CATEGORIES.length,
    locations: LOCATIONS.length,
    urls: urls
  };

  writeFileSync(
    '/Users/benknight/Code/JusticeHub/data/askizzy-urls.json',
    JSON.stringify(jsonData, null, 2)
  );

  // Save as CSV for easy viewing
  const csv = [
    'priority,category,location,url',
    ...urls.map(u => `${u.priority},${u.category},${u.location},${u.url}`)
  ].join('\n');

  writeFileSync(
    '/Users/benknight/Code/JusticeHub/data/askizzy-urls.csv',
    csv
  );

  console.log('✅ Files saved:');
  console.log('   - data/askizzy-urls.json');
  console.log('   - data/askizzy-urls.csv');
}

// Run report and save
console.log('');
const urls = generateReport();
console.log('');
saveToFile();
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Test with: npx tsx src/scripts/discovery/test-askizzy-scrape.ts');
console.log('   2. Run full scrape: npx tsx src/scripts/discovery/scrape-askizzy-comprehensive.ts');
console.log('');

export { generateURLs, CATEGORIES, LOCATIONS };
