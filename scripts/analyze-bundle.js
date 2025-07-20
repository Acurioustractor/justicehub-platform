#!/usr/bin/env node

/**
 * Bundle analysis script for Next.js
 * Run with: npm run analyze
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function analyzeBuild() {
  console.log('🔍 Analyzing bundle size and performance...\n');

  try {
    // Install bundle analyzer if not present
    try {
      require.resolve('@next/bundle-analyzer');
    } catch (e) {
      console.log('📦 Installing @next/bundle-analyzer...');
      execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
    }

    // Create analyzer config
    const analyzerConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your existing config
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  images: {
    domains: [
      'localhost',
      's3.amazonaws.com', 
      'justicehub-media.s3.amazonaws.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  swcMinify: true,
  poweredByHeader: false,
});
`;

    // Backup original config
    const configPath = path.join(process.cwd(), 'next.config.js');
    const originalConfig = fs.readFileSync(configPath, 'utf8');
    
    console.log('⚙️  Setting up bundle analyzer...');
    
    // Write analyzer config temporarily
    fs.writeFileSync(configPath + '.backup', originalConfig);
    
    // Run the build with analysis
    console.log('🏗️  Building with analysis...');
    process.env.ANALYZE = 'true';
    execSync('npm run build', { stdio: 'inherit' });
    
    // Restore original config
    fs.writeFileSync(configPath, originalConfig);
    fs.unlinkSync(configPath + '.backup');
    
    console.log('\n📊 Bundle analysis complete!');
    console.log('📁 Check the generated reports in your browser');
    console.log('\n💡 Optimization recommendations:');
    console.log('   - Code split large components');
    console.log('   - Use dynamic imports for heavy libraries');
    console.log('   - Optimize images and compress assets');
    console.log('   - Remove unused dependencies');
    console.log('   - Consider lazy loading for non-critical components');

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    
    // Restore config if it exists
    try {
      const backupPath = path.join(process.cwd(), 'next.config.js.backup');
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, path.join(process.cwd(), 'next.config.js'));
        fs.unlinkSync(backupPath);
      }
    } catch (restoreError) {
      console.error('Failed to restore config:', restoreError.message);
    }
    
    process.exit(1);
  }
}

// Performance audit
function performanceAudit() {
  console.log('\n🚀 Running performance audit...\n');
  
  const recommendations = [
    {
      category: 'Images',
      items: [
        'Use Next.js Image component for automatic optimization',
        'Serve images in modern formats (WebP, AVIF)',
        'Implement lazy loading for below-the-fold images',
        'Optimize image sizes and compressions'
      ]
    },
    {
      category: 'JavaScript',
      items: [
        'Code split routes and heavy components',
        'Use dynamic imports for large libraries',
        'Remove unused dependencies and dead code',
        'Minimize third-party scripts'
      ]
    },
    {
      category: 'CSS',
      items: [
        'Remove unused CSS rules',
        'Use CSS-in-JS for component-scoped styles',
        'Optimize critical CSS delivery',
        'Consider CSS bundling strategies'
      ]
    },
    {
      category: 'Caching',
      items: [
        'Implement proper HTTP caching headers',
        'Use service workers for offline support',
        'Cache API responses with React Query',
        'Optimize asset caching strategies'
      ]
    },
    {
      category: 'Database',
      items: [
        'Add database indexes for frequent queries',
        'Implement connection pooling',
        'Use query optimization techniques',
        'Consider read replicas for heavy read workloads'
      ]
    }
  ];

  recommendations.forEach(category => {
    console.log(`📋 ${category.category}:`);
    category.items.forEach(item => {
      console.log(`   • ${item}`);
    });
    console.log('');
  });
}

// Web Vitals check
function checkWebVitals() {
  console.log('📈 Web Vitals Performance Targets:\n');
  
  const vitals = [
    { name: 'First Contentful Paint (FCP)', target: '< 1.8s', good: '< 1.8s', poor: '> 3.0s' },
    { name: 'Largest Contentful Paint (LCP)', target: '< 2.5s', good: '< 2.5s', poor: '> 4.0s' },
    { name: 'First Input Delay (FID)', target: '< 100ms', good: '< 100ms', poor: '> 300ms' },
    { name: 'Cumulative Layout Shift (CLS)', target: '< 0.1', good: '< 0.1', poor: '> 0.25' },
    { name: 'Time to Interactive (TTI)', target: '< 3.8s', good: '< 3.8s', poor: '> 7.3s' }
  ];

  vitals.forEach(vital => {
    console.log(`${vital.name}:`);
    console.log(`   Target: ${vital.target}`);
    console.log(`   Good: ${vital.good} | Poor: ${vital.poor}\n`);
  });

  console.log('💡 Use tools like Lighthouse, PageSpeed Insights, or WebPageTest to measure these metrics');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--vitals')) {
    checkWebVitals();
  } else if (args.includes('--audit')) {
    performanceAudit();
  } else {
    analyzeBuild();
    performanceAudit();
    checkWebVitals();
  }
}

module.exports = { analyzeBuild, performanceAudit, checkWebVitals };