import { createSimpleServer } from './server-simple.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startFullStackServer() {
  try {
    const server = await createSimpleServer({ isFullStack: true });
    
    // Serve static files from frontend build
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    
    // Register static file serving BEFORE other routes
    const fastifyStatic = await import('@fastify/static');
    await server.register(fastifyStatic.default, {
      root: frontendPath,
      prefix: '/',
      prefixAvoidTrailingSlash: true,
      decorateReply: false
    });
    
    // Note: SPA routing handled by static file plugin and base server's NotFoundHandler
    
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    console.log(`🚀 Youth Justice Service Finder (Full-Stack) running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/docs`);
    console.log(`🌐 Frontend Application: http://${host}:${port}/`);
    console.log(`🔍 Search API: http://${host}:${port}/diagnostic-search`);
    console.log(`❤️ Health Check: http://${host}:${port}/health`);
    
  } catch (err) {
    console.error('Error starting full-stack server:', err);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startFullStackServer();
}

export { startFullStackServer };