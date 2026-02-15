/**
 * Direct Service Importer
 *
 * Bypasses SQL files and imports services directly using Supabase client.
 * This makes it much easier to add services programmatically.
 */

import { createClient } from '@supabase/supabase-js';

// Initialize with service role key for admin operations (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
);

export interface ServiceInput {
  name: string;
  description?: string;
  organizationName?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  categories?: string[];
  metadata?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  serviceId?: string;
  organizationId?: string;
  message: string;
  isNew: boolean;
}

/**
 * Generate a URL-safe slug from a string
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Import a single service directly
 */
export async function importService(service: ServiceInput): Promise<ImportResult> {
  try {
    // Step 1: Get or create organization
    const orgName = service.organizationName || service.name;

    let organizationId: string;

    // Check if organization exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', orgName)
      .single();

    if (existingOrg) {
      organizationId = existingOrg.id;

      // Update organization if we have new info
      if (service.website || service.description) {
        await supabase
          .from('organizations')
          .update({
            website_url: service.website || existingOrg.website_url,
            description: service.description || existingOrg.description,
          })
          .eq('id', organizationId);
      }
    } else {
      // Create new organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          description: service.description || `Service provider: ${orgName}`,
          website_url: service.website,
        })
        .select('id')
        .single();

      if (orgError) {
        return {
          success: false,
          message: `Failed to create organization: ${orgError.message}`,
          isNew: false,
        };
      }

      organizationId = newOrg!.id;
    }

    // Step 2: Check if service already exists
    const { data: existingService } = await supabase
      .from('services')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('name', service.name)
      .single();

    if (existingService) {
      // Update existing service
      const { error: updateError } = await supabase
        .from('services')
        .update({
          description: service.description || existingService.description,
          website_url: service.website,
          contact_phone: service.phone,
          contact_email: service.email,
          location_address: service.address,
          location_city: service.city || 'Queensland',
          location_state: service.state || 'QLD',
          location_postcode: service.postcode,
          service_category: service.categories || ['support'],
          metadata: {
            ...(existingService.metadata || {}),
            ...(service.metadata || {}),
            last_updated: new Date().toISOString(),
          },
        })
        .eq('id', existingService.id);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update service: ${updateError.message}`,
          isNew: false,
        };
      }

      return {
        success: true,
        serviceId: existingService.id,
        organizationId,
        message: `Updated existing service: ${service.name}`,
        isNew: false,
      };
    }

    // Step 3: Create new service
    const slug = `${generateSlug(service.name)}-${Math.random().toString(36).substring(2, 10)}`;

    const { data: newService, error: serviceError } = await supabase
      .from('services')
      .insert({
        name: service.name,
        slug,
        description: service.description || `Service provided by ${orgName}`,
        program_type: 'support',
        service_category: service.categories || ['support'],
        organization_id: organizationId,
        website_url: service.website,
        contact_phone: service.phone,
        contact_email: service.email,
        location_address: service.address,
        location_city: service.city || 'Queensland',
        location_state: service.state || 'QLD',
        location_postcode: service.postcode,
        metadata: {
          ...(service.metadata || {}),
          imported_at: new Date().toISOString(),
          import_method: 'direct',
        },
      })
      .select('id')
      .single();

    if (serviceError) {
      return {
        success: false,
        message: `Failed to create service: ${serviceError.message}`,
        isNew: false,
      };
    }

    return {
      success: true,
      serviceId: newService!.id,
      organizationId,
      message: `Created new service: ${service.name}`,
      isNew: true,
    };

  } catch (error) {
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isNew: false,
    };
  }
}

/**
 * Import multiple services in batch
 */
export async function importServices(services: ServiceInput[]): Promise<{
  total: number;
  created: number;
  updated: number;
  failed: number;
  results: ImportResult[];
}> {
  const results: ImportResult[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const service of services) {
    const result = await importService(service);
    results.push(result);

    if (result.success) {
      if (result.isNew) {
        created++;
      } else {
        updated++;
      }
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    total: services.length,
    created,
    updated,
    failed,
    results,
  };
}

/**
 * Quick helper to import from simple list of names
 */
export async function importServiceNames(
  names: string[],
  defaultMetadata?: Record<string, any>
): Promise<ImportResult[]> {
  const services: ServiceInput[] = names.map(name => ({
    name,
    metadata: defaultMetadata,
  }));

  const result = await importServices(services);
  return result.results;
}
