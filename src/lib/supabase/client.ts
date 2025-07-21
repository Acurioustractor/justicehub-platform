/**
 * Supabase Client Configuration
 * 
 * Provides secure, type-safe Supabase client instances for different use cases:
 * - Client-side operations (anon key)
 * - Server-side operations (service key)
 * - Module-specific clients
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Define database types based on our schema
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          type: string;
          description: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          street_address: string | null;
          suburb: string | null;
          city: string | null;
          state: string | null;
          postcode: string | null;
          latitude: number | null;
          longitude: number | null;
          verification_status: string;
          is_active: boolean;
          logo_url: string | null;
          tags: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          slug: string;
          organization_id: string;
          description: string;
          program_type: string;
          service_category: string[] | null;
          target_age_min: number | null;
          target_age_max: number | null;
          delivery_method: string[];
          capacity_total: number | null;
          capacity_current: number;
          is_accepting_referrals: boolean;
          success_rate: number | null;
          is_featured: boolean;
          tags: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      stories: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          slug: string;
          author_id: string | null;
          author_name: string | null;
          content: string;
          excerpt: string | null;
          content_type: string;
          story_category: string[] | null;
          visibility: string;
          is_anonymous: boolean;
          status: string;
          published_at: string | null;
          view_count: number;
          like_count: number;
          featured_image_url: string | null;
          tags: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['stories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
      };
      people: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          first_name: string;
          last_name: string;
          preferred_name: string | null;
          title: string | null;
          role: string | null;
          bio: string | null;
          email: string | null;
          expertise_areas: string[] | null;
          is_mentor: boolean;
          is_public_profile: boolean;
          availability_status: string;
          total_mentees: number;
          avg_rating: number | null;
        };
        Insert: Omit<Database['public']['Tables']['people']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['people']['Insert']>;
      };
      art_submissions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          artist_name: string;
          artist_age: number | null;
          medium: string;
          description: string;
          primary_media_url: string;
          status: string;
          visibility: string;
          is_featured: boolean;
          view_count: number;
          like_count: number;
          themes: string[] | null;
          tags: string[] | null;
        };
        Insert: Omit<Database['public']['Tables']['art_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['art_submissions']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Client-side Supabase client (uses anon key)
export const createSupabaseClient = (): SupabaseClient<Database> => {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': 'justicehub-web'
        }
      }
    }
  );
};

// Server-side Supabase client (uses service key for admin operations)
export const createSupabaseServerClient = (): SupabaseClient<Database> => {
  if (!env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY is required for server-side operations');
  }
  
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'justicehub-server'
        }
      }
    }
  );
};

// Youth Justice Service Finder module client
export const createYJSFClient = (): SupabaseClient<Database> => {
  const config = env.getYJSFConfig();
  
  return createClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'yjsf-module'
        }
      }
    }
  );
};

// QLD Justice Tracker module client
export const createQJTClient = (): SupabaseClient<Database> => {
  const config = env.getQJTConfig();
  
  return createClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'qjt-module'
        }
      }
    }
  );
};

// Default client instance for client-side usage
export const supabase = createSupabaseClient();

// Utility function to get the appropriate client based on context
export const getSupabaseClient = (context: 'client' | 'server' | 'yjsf' | 'qjt' = 'client') => {
  switch (context) {
    case 'server':
      return createSupabaseServerClient();
    case 'yjsf':
      return createYJSFClient();
    case 'qjt':
      return createQJTClient();
    default:
      return createSupabaseClient();
  }
};

// Helper function to test connection
export const testSupabaseConnection = async (client?: SupabaseClient<Database>) => {
  const testClient = client || supabase;
  
  try {
    // Test basic connection by querying available tables
    const { data: tablesData, error: tablesError } = await testClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
      
    if (tablesError) {
      throw new Error(`Connection failed: ${tablesError.message} (${tablesError.code || 'no code'})`);
    }
    
    const tables = tablesData?.map(t => t.table_name) || [];
    return { 
      success: true, 
      message: `Connection successful (found ${tables.length} tables)`,
      tables 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      error 
    };
  }
};

export default supabase;