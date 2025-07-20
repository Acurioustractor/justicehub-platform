#!/usr/bin/env node

/**
 * Unified Deployment Script
 * 
 * This script handles deployment to Vercel with both frontend and API
 * consolidated into a single deployment to solve the "why do we have 
 * an api site and then a frontend" issue.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const logger = pino({ name: 'unified-deployment' });

// Configuration
const config = {
  vercelProject: 'youth-justice-service-finder',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  apiDirectory: 'api',
  requiredEnvVars: [
    'DATABASE_URL',
    'NODE_ENV'
  ]
};

async function checkPrerequisites() {
  logger.info('Checking deployment prerequisites...');
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    logger.info('✓ Vercel CLI is installed');
  } catch (error) {
    logger.error('✗ Vercel CLI is not installed. Run: npm install -g vercel');
    process.exit(1);
  }
  
  // Check if we're in the right directory
  if (!fs.existsSync('./package.json')) {
    logger.error('✗ package.json not found. Run this script from the project root.');
    process.exit(1);
  }
  
  // Check if API directory exists
  if (!fs.existsSync('./api')) {
    logger.error('✗ API directory not found. API endpoints are required for unified deployment.');
    process.exit(1);
  }
  
  // Check if frontend build directory exists or can be created
  if (!fs.existsSync('./frontend')) {
    logger.error('✗ Frontend directory not found.');
    process.exit(1);
  }
  
  logger.info('✓ All prerequisites met');
}

async function buildFrontend() {
  logger.info('Building frontend...');
  
  try {
    // Change to frontend directory and build
    process.chdir('./frontend');
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
    
    // Move build output to root level for Vercel
    const buildDir = './dist';
    const rootBuildDir = '../dist';
    
    if (fs.existsSync(buildDir)) {
      // Remove existing build in root
      if (fs.existsSync(rootBuildDir)) {
        execSync(`rm -rf ${rootBuildDir}`, { stdio: 'inherit' });
      }
      
      // Move build to root
      execSync(`mv ${buildDir} ${rootBuildDir}`, { stdio: 'inherit' });
      logger.info('✓ Frontend built and moved to root');
    } else {
      logger.error('✗ Frontend build failed - no dist directory found');
      process.exit(1);
    }
    
    // Return to root directory
    process.chdir('../');
    
  } catch (error) {
    logger.error('✗ Frontend build failed:', error.message);
    process.exit(1);
  }
}

async function validateApiEndpoints() {
  logger.info('Validating API endpoints...');
  
  const apiDir = './api';
  const requiredEndpoints = [
    'health.js',
    'health-database.js',
    'services-insights.js',
    'dashboard-data.js',
    'working-search.js',
    'geocoding-analysis.js',
    'geocoding-start.js',
    'geocoding-status.js',
    'budget-intelligence.js'
  ];
  
  const missingEndpoints = requiredEndpoints.filter(endpoint => 
    !fs.existsSync(path.join(apiDir, endpoint))
  );
  
  if (missingEndpoints.length > 0) {
    logger.warn(`Missing API endpoints: ${missingEndpoints.join(', ')}`);\n  } else {\n    logger.info('✓ All API endpoints are present');\n  }\n}\n\nasync function checkEnvironmentVariables() {\n  logger.info('Checking environment variables...');\n  \n  const missingVars = config.requiredEnvVars.filter(varName => !process.env[varName]);\n  \n  if (missingVars.length > 0) {\n    logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);\n    logger.info('These will need to be set in Vercel project settings.');\n  } else {\n    logger.info('✓ All required environment variables are set');\n  }\n}\n\nasync function deployToVercel(isProduction = false) {\n  logger.info(`Deploying to Vercel ${isProduction ? '(production)' : '(preview)'}...`);\n  \n  try {\n    const deployCmd = isProduction ? 'vercel --prod' : 'vercel';\n    \n    logger.info('Running Vercel deployment...');\n    const output = execSync(deployCmd, { \n      stdio: 'pipe', \n      encoding: 'utf8' \n    });\n    \n    // Extract deployment URL from output\n    const lines = output.split('\\n');\n    const deploymentUrl = lines.find(line => line.includes('https://'));\n    \n    if (deploymentUrl) {\n      logger.info(`✓ Deployment successful: ${deploymentUrl.trim()}`);\n      return deploymentUrl.trim();\n    } else {\n      logger.info('✓ Deployment completed');\n      return null;\n    }\n    \n  } catch (error) {\n    logger.error('✗ Vercel deployment failed:', error.message);\n    process.exit(1);\n  }\n}\n\nasync function testDeployment(deploymentUrl) {\n  if (!deploymentUrl) {\n    logger.info('Skipping deployment test - no URL provided');\n    return;\n  }\n  \n  logger.info(`Testing deployment at ${deploymentUrl}...`);\n  \n  const testEndpoints = [\n    '',  // Frontend root\n    '/api/health',\n    '/api/working-search?limit=1',\n    '/dashboard'\n  ];\n  \n  for (const endpoint of testEndpoints) {\n    try {\n      const testUrl = `${deploymentUrl}${endpoint}`;\n      logger.info(`Testing ${testUrl}...`);\n      \n      const response = await fetch(testUrl);\n      if (response.ok) {\n        logger.info(`✓ ${endpoint || 'root'} is working`);\n      } else {\n        logger.warn(`⚠ ${endpoint || 'root'} returned ${response.status}`);\n      }\n    } catch (error) {\n      logger.warn(`⚠ ${endpoint || 'root'} test failed:`, error.message);\n    }\n  }\n}\n\nasync function generateDeploymentReport() {\n  logger.info('Generating deployment report...');\n  \n  const report = {\n    timestamp: new Date().toISOString(),\n    deployment: {\n      type: 'unified',\n      platform: 'vercel',\n      project: config.vercelProject\n    },\n    features: {\n      frontend: 'React + Vite',\n      api: 'Node.js Serverless Functions',\n      database: 'PostgreSQL (Railway)',\n      geocoding: 'Australian Address Intelligence',\n      mapping: 'Leaflet with clustering',\n      analytics: 'Service insights engine'\n    },\n    endpoints: {\n      frontend: '/',\n      dashboard: '/dashboard',\n      api: '/api/*',\n      search: '/api/working-search',\n      geocoding: '/api/geocoding/*',\n      budget: '/api/budget-intelligence/*'\n    },\n    benefits: [\n      'Single domain for both frontend and API',\n      'Simplified deployment and maintenance',\n      'Better performance with co-location',\n      'Unified SSL certificate',\n      'Single authentication system',\n      'Reduced CORS complexity'\n    ]\n  };\n  \n  fs.writeFileSync('./deployment-report.json', JSON.stringify(report, null, 2));\n  logger.info('✓ Deployment report saved to deployment-report.json');\n}\n\n// Command line interface\nif (import.meta.url === `file://${process.argv[1]}`) {\n  const args = process.argv.slice(2);\n  const command = args[0] || 'deploy';\n  const isProduction = args.includes('--prod') || args.includes('--production');\n  const skipBuild = args.includes('--skip-build');\n  const skipTest = args.includes('--skip-test');\n  \n  async function main() {\n    try {\n      logger.info('🚀 Starting unified deployment process...');\n      \n      switch (command) {\n        case 'deploy':\n          await checkPrerequisites();\n          await validateApiEndpoints();\n          await checkEnvironmentVariables();\n          \n          if (!skipBuild) {\n            await buildFrontend();\n          }\n          \n          const deploymentUrl = await deployToVercel(isProduction);\n          \n          if (!skipTest) {\n            await testDeployment(deploymentUrl);\n          }\n          \n          await generateDeploymentReport();\n          \n          logger.info('🎉 Unified deployment completed successfully!');\n          logger.info('\\n📊 Deployment consolidates:');\n          logger.info('  • Frontend (React) + API (Node.js) in single domain');\n          logger.info('  • Map with all 987 services + clustering');\n          logger.info('  • Systematic Australian geocoding service');\n          logger.info('  • Real-time dashboard and analytics');\n          logger.info('  • Budget intelligence and insights');\n          break;\n          \n        case 'build':\n          await checkPrerequisites();\n          await buildFrontend();\n          logger.info('✓ Build completed');\n          break;\n          \n        case 'test':\n          const url = args[1] || 'https://youth-justice-service-finder.vercel.app';\n          await testDeployment(url);\n          break;\n          \n        case 'validate':\n          await checkPrerequisites();\n          await validateApiEndpoints();\n          await checkEnvironmentVariables();\n          logger.info('✓ Validation completed');\n          break;\n          \n        default:\n          logger.info(`\nUsage: node deploy-unified.js [command] [options]\n\nCommands:\n  deploy      - Full deployment process (default)\n  build       - Build frontend only\n  test <url>  - Test deployment endpoints\n  validate    - Validate prerequisites\n\nOptions:\n  --prod, --production  - Deploy to production\n  --skip-build         - Skip frontend build\n  --skip-test          - Skip deployment testing\n\nExamples:\n  node deploy-unified.js deploy --prod\n  node deploy-unified.js build\n  node deploy-unified.js test https://your-deployment.vercel.app\n  `);\n      }\n      \n    } catch (error) {\n      logger.error('Deployment failed:', error.message);\n      process.exit(1);\n    }\n  }\n  \n  main();\n}\n\nexport { deployToVercel, buildFrontend, testDeployment };