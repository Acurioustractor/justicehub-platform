
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Config
const COST_OF_FAILURE = 160000; // Annual incarceration cost
const AVG_PARTICIPANTS = 50; // Conservative estimate if unknown
const AVG_PROGRAM_COST = 200000; // Conservative estimate if unknown

async function runSimulation() {
    console.log('🚀 Starting Portfolio Simulation...');

    // 1. Fetch Interventions
    const { data: interventions, error } = await supabase
        .from('alma_interventions')
        .select('id, name, type, evidence_level, current_funding');

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log(`Found ${interventions.length} interventions.`);

    let totalInvestment = 0;
    let totalAvoidedCost = 0;
    let totalNPS = 0;

    const breakdown = {
        'Proven': { count: 0, nps: 0 },
        'Effective': { count: 0, nps: 0 },
        'Promising': { count: 0, nps: 0 },
        'Untested': { count: 0, nps: 0 },
    };

    const simulatedPortfolio = interventions.map(i => {
        // success rate logic
        let successRate = 0.1;
        let category = 'Untested';

        if (i.evidence_level?.includes('Proven')) { successRate = 0.45; category = 'Proven'; }
        else if (i.evidence_level?.includes('Effective') || i.evidence_level?.includes('Indigenous-led')) { successRate = 0.35; category = 'Effective'; }
        else if (i.evidence_level?.includes('Promising')) { successRate = 0.20; category = 'Promising'; }

        // Simulation assumptions
        const participants = AVG_PARTICIPANTS;
        const cost = AVG_PROGRAM_COST;

        // Calc
        const valueCreated = participants * successRate * COST_OF_FAILURE;
        const nps = valueCreated - cost;

        // Aggregates
        totalInvestment += cost;
        totalAvoidedCost += valueCreated;
        totalNPS += nps;

        // Breakdown
        if (breakdown[category]) {
            breakdown[category].count++;
            breakdown[category].nps += nps;
        }

        return {
            name: i.name,
            category,
            nps,
            yield: cost > 0 ? (valueCreated / cost) : 0
        };
    });

    const result = {
        timestamp: new Date().toISOString(),
        stats: {
            interventionCount: interventions.length,
            totalInvestment,
            totalAvoidedCost,
            totalNPS,
            portfolioYield: totalInvestment > 0 ? (totalAvoidedCost / totalInvestment) : 0
        },
        breakdown,
        topPerformers: simulatedPortfolio.sort((a, b) => b.nps - a.nps).slice(0, 5)
    };

    // Output
    console.log('\n--- SIMULATION RESULTS ---');
    console.log(`Total Investment Required: $${(totalInvestment / 1000000).toFixed(1)}M`);
    console.log(`Total Value Created (Avoided): $${(totalAvoidedCost / 1000000).toFixed(1)}M`);
    console.log(`Net Present Safety (NPS): $${(totalNPS / 1000000).toFixed(1)}M`);
    console.log(`Portfolio Yield: ${(result.stats.portfolioYield).toFixed(1)}x`);
    console.log('--------------------------\n');

    // Save to file for Frontend
    const outputPath = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

    fs.writeFileSync(path.join(outputPath, 'portfolio-simulation.json'), JSON.stringify(result, null, 2));
    console.log(`✅ Data saved to src/data/portfolio-simulation.json`);
}

runSimulation();
