#!/usr/bin/env node
/**
 * Service Verification System
 *
 * Manages service verification workflow with multiple levels:
 * - unverified: Imported from automated sources
 * - pending: Contact info added, needs manual verification
 * - verified: Confirmed accurate by manual check or AI
 * - featured: High-quality, complete, verified, ready to highlight
 * - flagged: Needs review (outdated, duplicate, or incorrect)
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'featured' | 'flagged';

interface Service {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  location_address: string | null;
  service_category: string[];
  metadata: any;
}

interface VerificationReport {
  serviceId: string;
  serviceName: string;
  status: VerificationStatus;
  completeness: number;
  dataQuality: number;
  issues: string[];
  recommendations: string[];
  lastVerified?: string;
}

function calculateCompleteness(service: Service): number {
  const fields = [
    service.name,
    service.description,
    service.website_url,
    service.contact_phone,
    service.contact_email,
    service.location_address,
    service.service_category && service.service_category.length > 1
  ];

  const filledFields = fields.filter(f => f).length;
  return Math.round((filledFields / fields.length) * 100);
}

function calculateDataQuality(service: Service): number {
  let score = 0;
  let maxScore = 0;

  // Description quality (0-30 points)
  maxScore += 30;
  if (service.description) {
    if (service.description.length > 100) score += 30;
    else if (service.description.length > 50) score += 20;
    else score += 10;
  }

  // Contact completeness (0-30 points)
  maxScore += 30;
  if (service.website_url) score += 10;
  if (service.contact_phone) score += 10;
  if (service.contact_email) score += 10;

  // Category quality (0-20 points)
  maxScore += 20;
  if (service.service_category && service.service_category.length > 1) {
    if (!service.service_category.includes('support')) score += 20;
    else if (service.service_category.length > 2) score += 15;
    else score += 10;
  }

  // Location completeness (0-20 points)
  maxScore += 20;
  if (service.location_address) score += 20;

  return Math.round((score / maxScore) * 100);
}

function identifyIssues(service: Service): string[] {
  const issues: string[] = [];

  if (!service.description || service.description.length < 50) {
    issues.push('Missing or inadequate description');
  }

  if (!service.website_url && !service.contact_phone && !service.contact_email) {
    issues.push('No contact information available');
  }

  if (!service.service_category || service.service_category.length === 0) {
    issues.push('No categories assigned');
  } else if (service.service_category.length === 1 && service.service_category[0] === 'support') {
    issues.push('Only generic "support" category assigned');
  }

  if (!service.location_address) {
    issues.push('Missing physical address');
  }

  // Check for generic descriptions
  if (service.description && service.description.includes('Youth justice service provider')) {
    issues.push('Generic auto-generated description');
  }

  return issues;
}

function generateRecommendations(service: Service, issues: string[]): string[] {
  const recommendations: string[] = [];

  if (issues.includes('Missing or inadequate description')) {
    recommendations.push('Add detailed service description (aim for 150+ characters)');
  }

  if (issues.includes('No contact information available')) {
    recommendations.push('Add website, phone, or email for the service');
  }

  if (issues.includes('Only generic "support" category assigned')) {
    recommendations.push('Review and assign specific categories (mental_health, housing, etc.)');
  }

  if (issues.includes('Missing physical address')) {
    recommendations.push('Add physical address or specify if service is online/phone-based');
  }

  if (issues.includes('Generic auto-generated description')) {
    recommendations.push('Replace auto-generated description with accurate service details');
  }

  const completeness = calculateCompleteness(service);
  if (completeness >= 90) {
    recommendations.push('Service is highly complete - ready for "featured" status');
  } else if (completeness >= 70) {
    recommendations.push('Service is well-formed - ready for "verified" status');
  } else if (completeness >= 50) {
    recommendations.push('Service needs minor improvements for verification');
  } else {
    recommendations.push('Service needs significant enrichment before verification');
  }

  return recommendations;
}

function determineVerificationStatus(
  service: Service,
  completeness: number,
  dataQuality: number,
  issues: string[]
): VerificationStatus {
  // Already has verification status in metadata
  if (service.metadata?.verification_status) {
    return service.metadata.verification_status;
  }

  // Government verified
  if (service.metadata?.government_verified) {
    if (completeness >= 80 && dataQuality >= 70) {
      return 'verified';
    }
    return 'pending';
  }

  // Featured status: high quality, complete, verified
  if (completeness >= 90 && dataQuality >= 80 && issues.length === 0) {
    return 'featured';
  }

  // Verified status: good quality and completeness
  if (completeness >= 70 && dataQuality >= 60) {
    return 'verified';
  }

  // Pending status: some info but needs verification
  if (completeness >= 40) {
    return 'pending';
  }

  // Flagged if serious issues
  if (issues.length >= 4) {
    return 'flagged';
  }

  return 'unverified';
}

async function generateVerificationReport(service: Service): Promise<VerificationReport> {
  const completeness = calculateCompleteness(service);
  const dataQuality = calculateDataQuality(service);
  const issues = identifyIssues(service);
  const recommendations = generateRecommendations(service, issues);
  const status = determineVerificationStatus(service, completeness, dataQuality, issues);

  return {
    serviceId: service.id,
    serviceName: service.name,
    status,
    completeness,
    dataQuality,
    issues,
    recommendations,
    lastVerified: service.metadata?.last_verified || undefined
  };
}

async function updateServiceVerificationStatus(serviceId: string, status: VerificationStatus) {
  const { error } = await supabase
    .from('services')
    .update({
      metadata: {
        verification_status: status,
        last_verified: new Date().toISOString()
      }
    })
    .eq('id', serviceId);

  if (error) {
    console.error(`Failed to update service ${serviceId}:`, error);
  }
}

async function analyzeAllServices() {
  console.log('============================================================');
  console.log('📋 SERVICE VERIFICATION ANALYSIS');
  console.log('============================================================\n');

  // Fetch all services
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  if (error || !services) {
    console.error('Failed to fetch services:', error);
    return;
  }

  console.log(`Total services: ${services.length}\n`);

  // Generate reports for all services
  const reports: VerificationReport[] = [];
  for (const service of services) {
    const report = await generateVerificationReport(service);
    reports.push(report);
  }

  // Summarize by status
  const statusCounts = {
    unverified: reports.filter(r => r.status === 'unverified').length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    featured: reports.filter(r => r.status === 'featured').length,
    flagged: reports.filter(r => r.status === 'flagged').length,
  };

  console.log('📊 VERIFICATION STATUS SUMMARY');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`🔴 Unverified: ${statusCounts.unverified} (${Math.round(statusCounts.unverified / services.length * 100)}%)`);
  console.log(`🟡 Pending: ${statusCounts.pending} (${Math.round(statusCounts.pending / services.length * 100)}%)`);
  console.log(`🟢 Verified: ${statusCounts.verified} (${Math.round(statusCounts.verified / services.length * 100)}%)`);
  console.log(`⭐ Featured: ${statusCounts.featured} (${Math.round(statusCounts.featured / services.length * 100)}%)`);
  console.log(`🚩 Flagged: ${statusCounts.flagged} (${Math.round(statusCounts.flagged / services.length * 100)}%)`);

  // Average metrics
  const avgCompleteness = Math.round(reports.reduce((sum, r) => sum + r.completeness, 0) / reports.length);
  const avgQuality = Math.round(reports.reduce((sum, r) => sum + r.dataQuality, 0) / reports.length);

  console.log('\n📈 QUALITY METRICS');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Average completeness: ${avgCompleteness}%`);
  console.log(`Average data quality: ${avgQuality}%`);

  // Top issues
  const allIssues: { [key: string]: number } = {};
  reports.forEach(r => {
    r.issues.forEach(issue => {
      allIssues[issue] = (allIssues[issue] || 0) + 1;
    });
  });

  const topIssues = Object.entries(allIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('\n🔍 TOP ISSUES');
  console.log('────────────────────────────────────────────────────────────');
  topIssues.forEach(([issue, count]) => {
    console.log(`• ${issue}: ${count} services (${Math.round(count / services.length * 100)}%)`);
  });

  // Ready for promotion
  const readyForVerified = reports.filter(r =>
    r.status === 'pending' && r.completeness >= 70 && r.dataQuality >= 60
  );
  const readyForFeatured = reports.filter(r =>
    r.status === 'verified' && r.completeness >= 90 && r.dataQuality >= 80
  );

  console.log('\n✨ READY FOR PROMOTION');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Pending → Verified: ${readyForVerified.length} services`);
  console.log(`Verified → Featured: ${readyForFeatured.length} services`);

  // Needs attention
  const needsAttention = reports.filter(r =>
    r.status === 'flagged' || (r.status === 'unverified' && r.dataQuality < 30)
  );

  console.log('\n⚠️  NEEDS ATTENTION');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`${needsAttention.length} services need immediate attention\n`);

  if (needsAttention.length > 0) {
    console.log('First 5 services needing attention:');
    needsAttention.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.serviceName} (${r.status})`);
      console.log(`   Completeness: ${r.completeness}% | Quality: ${r.dataQuality}%`);
      console.log(`   Issues: ${r.issues.join(', ')}`);
    });
  }

  return { reports, statusCounts, avgCompleteness, avgQuality };
}

async function promoteServices(dryRun: boolean = true) {
  console.log('\n============================================================');
  console.log('🎯 SERVICE PROMOTION');
  console.log('============================================================\n');

  const { data: services, error } = await supabase
    .from('services')
    .select('*');

  if (error || !services) {
    console.error('Failed to fetch services:', error);
    return;
  }

  let promoted = 0;

  for (const service of services) {
    const report = await generateVerificationReport(service);
    const currentStatus = service.metadata?.verification_status || 'unverified';

    // Determine if promotion is warranted
    let newStatus: VerificationStatus | null = null;

    if (currentStatus === 'pending' && report.completeness >= 70 && report.dataQuality >= 60) {
      newStatus = 'verified';
    } else if (currentStatus === 'verified' && report.completeness >= 90 && report.dataQuality >= 80 && report.issues.length === 0) {
      newStatus = 'featured';
    } else if (currentStatus === 'unverified' && service.metadata?.government_verified && report.completeness >= 50) {
      newStatus = 'pending';
    }

    if (newStatus && newStatus !== currentStatus) {
      console.log(`${service.name}: ${currentStatus} → ${newStatus}`);

      if (!dryRun) {
        await updateServiceVerificationStatus(service.id, newStatus);
      }

      promoted++;
    }
  }

  console.log(`\n${dryRun ? 'Would promote' : 'Promoted'} ${promoted} services`);

  if (dryRun) {
    console.log('\n💡 Run with --apply flag to actually promote services');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'analyze' || !command) {
    await analyzeAllServices();
  } else if (command === 'promote') {
    const apply = args.includes('--apply');
    await promoteServices(!apply);
  } else if (command === 'help') {
    console.log(`
Service Verification System

Usage:
  npm run verify             # Analyze all services
  npm run verify analyze     # Same as above
  npm run verify promote     # Dry run promotion
  npm run verify promote --apply  # Actually promote services

Verification Levels:
  🔴 unverified - Imported, needs enrichment
  🟡 pending    - Has some data, needs verification
  🟢 verified   - Confirmed accurate
  ⭐ featured   - High quality, ready to highlight
  🚩 flagged    - Needs review
    `);
  } else {
    console.log(`Unknown command: ${command}`);
    console.log('Run "npm run verify help" for usage information');
  }
}

main().catch(console.error);
