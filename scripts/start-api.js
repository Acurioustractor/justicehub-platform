#!/usr/bin/env node

import { createServer } from '../src/api/server.js';

console.log(`
╔════════════════════════════════════════════════════╗
║         Youth Justice Service Finder API          ║
║              Starting Server...                    ║
╚════════════════════════════════════════════════════╝
`);

async function startAPI() {
  try {
    const server = await createServer();
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '127.0.0.1';
    
    await server.listen({ port, host });
    
    console.log(`
🚀 Youth Justice Service Finder API is running!

📍 Server: http://${host}:${port}
📚 API Documentation: http://${host}:${port}/docs
🔍 Search Endpoint: http://${host}:${port}/search
📊 Health Check: http://${host}:${port}/health
📈 Statistics: http://${host}:${port}/stats

Available Endpoints:
- GET  /services              List all services
- GET  /services/:id          Get service details
- GET  /organizations         List organizations  
- GET  /search                Advanced search
- GET  /search/nearby         Location-based search
- GET  /search/autocomplete   Search suggestions
- GET  /health                Health checks
- GET  /stats                 Database statistics

Press Ctrl+C to stop the server
`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Gracefully shutting down...');
      await server.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Failed to start API server:', err.message);
    process.exit(1);
  }
}

startAPI();