#!/usr/bin/env node
/**
 * Explore data.gov.au for youth justice and community service datasets
 *
 * Uses the CKAN API to search for relevant datasets
 */

import { writeFileSync } from 'fs';

const BASE_URL = 'https://data.gov.au/api/3/action';

interface CKANDataset {
  id: string;
  name: string;
  title: string;
  notes: string;
  organization: {
    name: string;
    title: string;
  };
  tags: Array<{ name: string }>;
  resources: Array<{
    id: string;
    name: string;
    format: string;
    url: string;
    description: string;
  }>;
}

interface SearchResult {
  help: string;
  success: boolean;
  result: {
    count: number;
    results: CKANDataset[];
  };
}

async function searchDatasets(query: string): Promise<CKANDataset[]> {
  const url = `${BASE_URL}/package_search?q=${encodeURIComponent(query)}&rows=100`;

  console.log(`\n🔍 Searching for: "${query}"`);

  const response = await fetch(url);
  const data: SearchResult = await response.json();

  if (!data.success) {
    console.error('Search failed:', data);
    return [];
  }

  console.log(`   Found ${data.result.count} datasets`);
  return data.result.results;
}

async function getDatasetDetails(datasetId: string): Promise<CKANDataset | null> {
  const url = `${BASE_URL}/package_show?id=${datasetId}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    return null;
  }

  return data.result;
}

function analyzeDataset(dataset: CKANDataset): {
  relevance: number;
  hasContacts: boolean;
  hasServiceList: boolean;
  format: string[];
  notes: string[];
} {
  const title = dataset.title.toLowerCase();
  const description = (dataset.notes || '').toLowerCase();
  const tags = dataset.tags.map(t => t.name.toLowerCase());

  let relevance = 0;
  const notes: string[] = [];

  // Check for relevant keywords
  const relevantKeywords = [
    'youth', 'community services', 'social services', 'child protection',
    'family support', 'mental health', 'housing', 'legal aid', 'aboriginal',
    'torres strait', 'indigenous', 'welfare', 'support services', 'non-profit',
    'ngo', 'organizations', 'providers', 'directory', 'queensland'
  ];

  relevantKeywords.forEach(keyword => {
    if (title.includes(keyword)) relevance += 10;
    if (description.includes(keyword)) relevance += 5;
    if (tags.some(tag => tag.includes(keyword))) relevance += 3;
  });

  // Check if it might contain service provider information
  const serviceKeywords = ['provider', 'organization', 'service', 'directory', 'register', 'list'];
  const hasServiceList = serviceKeywords.some(kw =>
    title.includes(kw) || description.includes(kw)
  );

  // Check if it might have contact information
  const contactKeywords = ['contact', 'phone', 'email', 'address', 'location'];
  const hasContacts = contactKeywords.some(kw =>
    title.includes(kw) || description.includes(kw)
  );

  // Get resource formats
  const formats = [...new Set(dataset.resources.map(r => r.format))];

  if (relevance > 0) {
    notes.push(`Relevance score: ${relevance}`);
  }
  if (hasServiceList) {
    notes.push('May contain service provider listings');
  }
  if (hasContacts) {
    notes.push('May contain contact information');
  }
  if (formats.includes('CSV') || formats.includes('JSON')) {
    notes.push('Available in machine-readable format');
  }

  return {
    relevance,
    hasContacts,
    hasServiceList,
    format: formats,
    notes
  };
}

async function main() {
  console.log('============================================================');
  console.log('🇦🇺 DATA.GOV.AU EXPLORATION');
  console.log('============================================================');
  console.log('Searching for youth justice and community service datasets\n');

  const searchTerms = [
    'youth services Queensland',
    'community services Queensland',
    'youth justice',
    'child protection services',
    'family support services',
    'social services directory',
    'community organizations Queensland',
    'non-profit services',
    'aboriginal services Queensland',
    'welfare services Queensland',
    'service providers Queensland'
  ];

  const allDatasets: Map<string, CKANDataset> = new Map();

  // Search for all terms
  for (const term of searchTerms) {
    const datasets = await searchDatasets(term);
    datasets.forEach(ds => allDatasets.set(ds.id, ds));

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Total unique datasets found: ${allDatasets.size}`);

  // Analyze each dataset
  const analyzed = Array.from(allDatasets.values()).map(dataset => ({
    dataset,
    analysis: analyzeDataset(dataset)
  }));

  // Sort by relevance
  analyzed.sort((a, b) => b.analysis.relevance - a.analysis.relevance);

  // Show top 20 most relevant
  console.log('\n📋 TOP 20 MOST RELEVANT DATASETS');
  console.log('════════════════════════════════════════════════════════════\n');

  analyzed.slice(0, 20).forEach((item, i) => {
    const { dataset, analysis } = item;

    if (analysis.relevance === 0) return;

    console.log(`${i + 1}. ${dataset.title}`);
    console.log(`   Organization: ${dataset.organization?.title || 'Unknown'}`);
    console.log(`   Formats: ${analysis.format.join(', ')}`);
    if (analysis.notes.length > 0) {
      console.log(`   Notes: ${analysis.notes.join('; ')}`);
    }
    console.log(`   URL: https://data.gov.au/dataset/${dataset.name}`);
    console.log();
  });

  // Find datasets with service lists and contacts
  const withServiceLists = analyzed.filter(a => a.analysis.hasServiceList && a.analysis.relevance > 0);
  const withContacts = analyzed.filter(a => a.analysis.hasContacts && a.analysis.relevance > 0);

  console.log('\n💡 KEY FINDINGS');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Total datasets found: ${allDatasets.size}`);
  console.log(`Relevant datasets: ${analyzed.filter(a => a.analysis.relevance > 0).length}`);
  console.log(`With service listings: ${withServiceLists.length}`);
  console.log(`With contact info: ${withContacts.length}`);

  // Export results
  const report = {
    searchDate: new Date().toISOString(),
    totalDatasets: allDatasets.size,
    relevantDatasets: analyzed.filter(a => a.analysis.relevance > 0).length,
    searchTerms,
    top20: analyzed.slice(0, 20).map(({ dataset, analysis }) => ({
      id: dataset.id,
      name: dataset.name,
      title: dataset.title,
      organization: dataset.organization?.title,
      description: dataset.notes?.substring(0, 200),
      url: `https://data.gov.au/dataset/${dataset.name}`,
      relevance: analysis.relevance,
      hasServiceList: analysis.hasServiceList,
      hasContacts: analysis.hasContacts,
      formats: analysis.format,
      resources: dataset.resources.map(r => ({
        name: r.name,
        format: r.format,
        url: r.url
      }))
    }))
  };

  const reportPath = 'data/datagovau-exploration-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${reportPath}`);

  // Recommendations
  console.log('\n📌 RECOMMENDATIONS');
  console.log('════════════════════════════════════════════════════════════');

  if (withServiceLists.length > 0) {
    console.log('\n✅ Promising datasets with service listings:');
    withServiceLists.slice(0, 5).forEach(({ dataset }) => {
      console.log(`   • ${dataset.title}`);
      console.log(`     https://data.gov.au/dataset/${dataset.name}`);
    });
  } else {
    console.log('\n⚠️  No datasets found with clear service provider listings');
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Manually review top 20 datasets');
  console.log('   2. Download promising CSV/JSON resources');
  console.log('   3. Check for API endpoints in dataset documentation');
  console.log('   4. Contact dataset publishers for additional data');

  console.log('\n============================================================');
}

main().catch(console.error);
