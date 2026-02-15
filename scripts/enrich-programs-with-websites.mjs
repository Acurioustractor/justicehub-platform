#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const env = readFileSync(join(root, '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line && line.trim() && line[0] !== '#' && line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🌐 ENRICHING PROGRAMS WITH WEBSITES\n');

// Known websites for major organizations
const websiteMap = {
  // NSW
  'Youth off the Streets': 'https://www.youthoffthestreets.com.au/',
  'The Shopfront Youth Legal Centre': 'https://www.theshopfront.org/',
  'Tharawal Aboriginal Corporation': 'https://www.tharawal.com.au/',
  'Link-Up NSW Aboriginal Corporation': 'https://www.linkupnsw.org.au/',
  'Stepping Stone House': 'https://steppingstonehouse.com.au/',
  'Det Nsw Norta Norta Program': 'https://education.nsw.gov.au/about-us/strategies-and-reports/norta-norta',
  'Police Citizens Youth Clubs NSW (PCYC)': 'https://www.pcycnsw.org.au/',
  'Yurungai Aboriginal Kinship Unit': 'https://www.yurungai.org.au/',
  'Katungul Aboriginal Corporation Community and Medical Services': 'https://www.katungul.org.au/',
  'NSW Youth Drug and Alcohol Court (YDAC)': 'https://www.judcom.nsw.gov.au/publications/ydac/',
  'Circle Sentencing NSW (Aboriginal)': 'https://www.judcom.nsw.gov.au/circle-sentencing/',

  // VIC
  'Aboriginal Advancement League Youth Programs': 'https://www.aal.org.au/',
  'Victorian Aboriginal Health Service (VAHS) Youth Programs': 'https://www.vahs.org.au/',
  'Rumbalara Football Netball Club Youth Programs': 'https://www.rumbalara.org.au/',
  'Centre for Multicultural Youth (CMY)': 'https://www.cmy.net.au/',
  'Odyssey House Victoria Youth AOD Services': 'https://www.odyssey.org.au/',
  'Melbourne City Mission Youth Services': 'https://www.mcm.org.au/',
  'Wathaurong Aboriginal Co-operative Youth Programs': 'https://www.wathaurong.org.au/',
  'Youth Projects': 'https://www.youthprojects.org.au/',
  'McAuley Community Services for Women': 'https://www.mcauleycsw.org.au/',
  'Quantum Support Services': 'https://www.quantumss.org.au/',
  'Whitelion Victoria': 'https://www.whitelion.asn.au/',
  'Victoria Police Youth Programs': 'https://www.police.vic.gov.au/youth-programs',
  'Rumbalara Aboriginal Co-operative': 'https://www.rumbalara.org.au/',
  'Gippsland and East Gippsland Aboriginal Co-operative (GEGAC)': 'https://www.gegac.org.au/',
  'Mallee District Aboriginal Services (MDAS)': 'https://www.mdas.org.au/',
  'The Salvation Army Westcare Youth Services': 'https://www.salvationarmy.org.au/westcare/',
  'Launch Housing Youth Services': 'https://www.launchhousing.org.au/',
  'Brotherhood of St Laurence Youth Programs': 'https://www.bsl.org.au/',
  'Victorian Aboriginal Community Controlled Health Organisation (VACCHO) Youth Network': 'https://www.vaccho.org.au/',
  'Koorie Court (Children\'s Court) VIC': 'https://www.courts.vic.gov.au/koorie-court',
  'Youth Support + Advocacy Service (YSAS)': 'https://www.ysas.org.au/',

  // WA
  'Yorgum Aboriginal Corporation Healing Services': 'https://www.yorgum.org.au/',
  'Aboriginal Alcohol and Drug Service (AADS)': 'https://www.aads.org.au/',
  'Marra Worra Worra Aboriginal Corporation Youth Programs': 'https://www.marraworra.org.au/',
  'Wirrpanda Foundation Youth Programs': 'https://www.wirrpanda.com.au/',
  'Youth Focus': 'https://www.youthfocus.com.au/',
  'Ngala Family Support Youth Services': 'https://www.ngala.com.au/',
  'Centrecare WA Youth Services': 'https://www.centrecare.com.au/',
  'Communicare Youth Services': 'https://www.communicare.org.au/',
  'Foyer Oxford (Anglicare WA)': 'https://www.anglicarewa.org.au/foyer-oxford',
  'Kulbardi Aboriginal Centre Youth Programs': 'https://www.murdoch.edu.au/kulbardi',
  'Jacaranda Community Centre Youth Programs': 'https://www.jacarandacc.org.au/',
  'YACWA (Youth Affairs Council of WA)': 'https://www.yacwa.org.au/',
  'Goldfields Individual and Family Support Association (GIFSA)': 'https://www.gifsa.org.au/',
  'Mission Australia WA Youth Services': 'https://www.missionaustralia.com.au/services-overview/children-youth-families-western-australia',
  'Nulsen Disability Services Youth Programs': 'https://www.nulsen.com.au/',
  'Nindilingarri Cultural Health Services Youth Programs': 'https://www.nindilingarri.org.au/',

  // SA
  'Junction Australia Youth Services': 'https://www.junctionaustralia.org.au/',
  'Nunkuwarrin Yunti Youth and Family Services': 'https://www.nunku.org.au/',

  // National/Multiple
  'headspace NSW Youth Mental Health': 'https://headspace.org.au/headspace-centres/nsw/',
  'headspace Victoria': 'https://headspace.org.au/headspace-centres/vic/',
  'headspace WA': 'https://headspace.org.au/headspace-centres/wa/',
  'Western Sydney University Equity Outreach': 'https://www.westernsydney.edu.au/future/student-life/equity-and-diversity',
};

// Get programs without websites
const { data: programs } = await supabase
  .from('alma_interventions')
  .select('id, name, operating_organization')
  .is('website', null);

console.log(`Found ${programs.length} programs without websites\n`);

// Update programs with known websites
let updated = 0;
let notFound = 0;

for (const program of programs) {
  const website = websiteMap[program.name];

  if (website) {
    const { error } = await supabase
      .from('alma_interventions')
      .update({ website })
      .eq('id', program.id);

    if (error) {
      console.error(`❌ ${program.name}:`, error.message);
    } else {
      console.log(`✅ ${program.name}`);
      console.log(`   → ${website}`);
      updated++;
    }
  } else {
    notFound++;
  }
}

console.log(`\n📊 SUMMARY\n`);
console.log(`Websites added: ${updated}`);
console.log(`Programs still missing websites: ${notFound}`);
console.log(`Total programs checked: ${programs.length}\n`);

// Show breakdown by organization type
const { data: stats } = await supabase
  .from('alma_interventions')
  .select('website, consent_level');

const withWebsite = stats.filter(p => p.website).length;
const withoutWebsite = stats.filter(p => !p.website).length;
const aboriginalWithWebsite = stats.filter(p => p.website && p.consent_level === 'Community Controlled').length;
const aboriginalWithoutWebsite = stats.filter(p => !p.website && p.consent_level === 'Community Controlled').length;

console.log('📊 Website Coverage:\n');
console.log(`Overall: ${withWebsite}/${stats.length} (${((withWebsite/stats.length)*100).toFixed(1)}%)`);
console.log(`Aboriginal programs: ${aboriginalWithWebsite}/${aboriginalWithWebsite + aboriginalWithoutWebsite} have websites`);
console.log(`Government/NGO programs: ${withWebsite - aboriginalWithWebsite}/${stats.length - aboriginalWithWebsite - aboriginalWithoutWebsite} have websites\n`);
