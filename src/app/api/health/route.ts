import { NextResponse } from 'next/server';
import { testConnection } from '@/server/db';

export async function GET() {
  const dbConnected = await testConnection();
  
  return NextResponse.json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: dbConnected ? 'connected' : 'disconnected',
      auth: process.env.AUTH0_ISSUER_BASE_URL ? 'configured' : 'not configured',
      redis: process.env.REDIS_URL ? 'configured' : 'not configured',
      airtable: process.env.AIRTABLE_API_KEY ? 'configured' : 'not configured',
    },
    version: process.env.npm_package_version || '1.0.0',
  });
}