import fp from 'fastify-plugin';
import cacheService from '../../services/cache-service.js';

async function cachePlugin(fastify, options) {
  // Connect to cache service (optional - graceful fallback if Redis unavailable)
  try {
    await cacheService.connect();
    fastify.log.info('Cache service connected successfully');
  } catch (error) {
    fastify.log.warn('Cache service unavailable, continuing without caching:', error.message);
    // Return early if cache is not available
    return;
  }

  // Add cache decorator to fastify instance
  fastify.decorate('cache', cacheService);

  // Cache middleware for GET requests
  fastify.addHook('onRequest', async (request, reply) => {
    // Only cache GET requests
    if (request.method !== 'GET') return;

    // Skip caching for health checks and admin routes
    if (request.url.includes('/health') || 
        request.url.includes('/docs') || 
        request.url.includes('/admin')) return;

    // Generate cache key from URL and query params
    const cacheKey = cacheService.generateKey('api', {
      url: request.url,
      query: request.query
    });

    // Try to get cached response
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      reply.header('X-Cache', 'HIT');
      reply.send(cached);
      return;
    }

    // Store cache key for use in response hook
    request.cacheKey = cacheKey;
  });

  // Cache response for successful GET requests
  fastify.addHook('onSend', async (request, reply, payload) => {
    // Only cache successful GET responses
    if (request.method !== 'GET' || 
        reply.statusCode !== 200 || 
        !request.cacheKey) return payload;

    try {
      const data = JSON.parse(payload);
      
      // Determine TTL based on route
      let ttl = 300; // 5 minutes default
      
      if (request.url.includes('/stats')) ttl = 900; // 15 minutes for stats
      if (request.url.includes('/search')) ttl = 600; // 10 minutes for search
      if (request.url.includes('/services')) ttl = 1800; // 30 minutes for services

      await cacheService.set(request.cacheKey, data, ttl);
      reply.header('X-Cache', 'MISS');
    } catch (error) {
      // If payload isn't JSON, don't cache
      fastify.log.debug('Skipping cache for non-JSON response');
    }

    return payload;
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await cacheService.disconnect();
  });
}

export default fp(cachePlugin, {
  name: 'cache-plugin',
  dependencies: []
});