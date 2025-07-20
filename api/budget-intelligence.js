/**
 * Vercel Serverless Function: Budget Intelligence API
 */

import { Pool } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'budget-intelligence-api' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const pathParts = req.url.split('/').filter(part => part && part !== 'api' && part !== 'budget-intelligence');
    const endpoint = pathParts[0] || 'dashboard';
    
    logger.info({ endpoint, pathParts }, 'Processing budget intelligence request');

    switch (endpoint) {
      case 'dashboard':
        return await handleDashboard(req, res);
      case 'report':
        return await handleReport(req, res);
      case 'contracts':
        return await handleContracts(req, res);
      case 'allocations':
        return await handleAllocations(req, res);
      case 'trends':
        return await handleTrends(req, res);
      case 'opportunities':
        return await handleOpportunities(req, res);
      case 'alerts':
        return await handleAlerts(req, res);
      default:
        res.status(404).json({ error: 'Endpoint not found' });
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Budget intelligence API failed');
    res.status(500).json({
      success: false,
      error: 'Budget intelligence API failed',
      details: error.message
    });
  }
}

async function handleDashboard(req, res) {
  // Return demo dashboard data
  res.json({
    success: true,
    data: {
      totalBudget: 45623891.50,
      totalContracts: 324,
      totalServices: 1075,
      avgContractValue: 140812.62,
      topCategories: [
        { name: 'Detention Services', value: 18500000, percentage: 40.5 },
        { name: 'Community Services', value: 12800000, percentage: 28.1 },
        { name: 'Support Services', value: 6900000, percentage: 15.1 },
        { name: 'Legal Services', value: 3200000, percentage: 7.0 },
        { name: 'Education Services', value: 2400000, percentage: 5.3 }
      ],
      recentActivity: [
        { date: '2024-07-15', description: 'New detention facility contract awarded', amount: 2840000 },
        { date: '2024-07-10', description: 'Community corrections program renewal', amount: 1200000 },
        { date: '2024-07-05', description: 'Mental health support services expansion', amount: 850000 }
      ]
    }
  });
}

async function handleReport(req, res) {
  res.json({
    success: true,
    data: {
      summary: {
        totalAmount: 45623891.50,
        totalContracts: 324,
        avgAmount: 140812.62,
        period: '2024-25 Financial Year'
      },
      breakdown: {
        byCategory: [
          { category: 'Detention Services', count: 45, total: 18500000 },
          { category: 'Community Services', count: 78, total: 12800000 },
          { category: 'Support Services', count: 120, total: 6900000 },
          { category: 'Legal Services', count: 32, total: 3200000 },
          { category: 'Education Services', count: 28, total: 2400000 }
        ],
        byRegion: [
          { region: 'QLD', count: 180, total: 25000000 },
          { region: 'NSW', count: 85, total: 12000000 },
          { region: 'VIC', count: 35, total: 5500000 },
          { region: 'WA', count: 24, total: 3100000 }
        ]
      }
    }
  });
}

async function handleContracts(req, res) {
  const { limit = 50, offset = 0 } = req.query;
  
  res.json({
    success: true,
    data: {
      contracts: [
        {
          id: 'contract-001',
          supplier: 'Youth Justice Centre Brisbane',
          description: 'Secure detention facility operations',
          amount: 2840000,
          startDate: '2024-07-01',
          endDate: '2025-06-30',
          status: 'Active'
        },
        {
          id: 'contract-002',
          supplier: 'Community Corrections QLD',
          description: 'Community-based supervision services',
          amount: 2100000,
          startDate: '2024-07-01',
          endDate: '2025-06-30',
          status: 'Active'
        }
      ],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: 324,
        pages: Math.ceil(324 / parseInt(limit))
      }
    }
  });
}

async function handleAllocations(req, res) {
  const { year = '2024-25' } = req.query;
  
  res.json({
    success: true,
    data: {
      year,
      allocations: [
        { department: 'Department of Youth Justice', allocated: 35000000, spent: 28500000 },
        { department: 'Community Services', allocated: 8000000, spent: 6800000 },
        { department: 'Education Support', allocated: 2600000, spent: 2400000 }
      ]
    }
  });
}

async function handleTrends(req, res) {
  res.json({
    success: true,
    data: {
      trends: [
        { month: '2024-07', spending: 3800000, contracts: 28 },
        { month: '2024-06', spending: 3200000, contracts: 24 },
        { month: '2024-05', spending: 4100000, contracts: 32 },
        { month: '2024-04', spending: 3600000, contracts: 26 }
      ]
    }
  });
}

async function handleOpportunities(req, res) {
  res.json({
    success: true,
    data: {
      opportunities: [
        {
          id: 'opp-001',
          title: 'Community Youth Support Program',
          description: 'Expansion of community-based youth support services',
          estimatedValue: 1200000,
          deadline: '2024-08-15',
          status: 'Open'
        },
        {
          id: 'opp-002',
          title: 'Mental Health First Aid Training',
          description: 'Training program for youth workers',
          estimatedValue: 450000,
          deadline: '2024-08-30',
          status: 'Open'
        }
      ]
    }
  });
}

async function handleAlerts(req, res) {
  res.json({
    success: true,
    data: {
      alerts: [
        {
          id: 'alert-001',
          type: 'warning',
          title: 'Budget Variance Alert',
          message: 'Community Services spending is 15% over budget this quarter',
          date: '2024-07-15'
        },
        {
          id: 'alert-002',
          type: 'info',
          title: 'Contract Renewal Due',
          message: 'Youth Justice Centre Brisbane contract expires in 30 days',
          date: '2024-07-10'
        }
      ]
    }
  });
}