import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.YJSF_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.YJSF_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        config: {
          url: supabaseUrl ? 'Set' : 'Missing',
          key: supabaseKey ? 'Set' : 'Missing'
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get table schema info
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch table info',
        message: tablesError.message,
        config: {
          url: supabaseUrl,
          keyLength: supabaseKey.length,
          keyStart: supabaseKey.substring(0, 10) + '...'
        }
      });
    }

    // Try to check if services table exists and get sample data
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('id, name, project')
      .limit(5);

    return NextResponse.json({
      success: true,
      config: {
        url: supabaseUrl,
        keyLength: supabaseKey.length,
        keyStart: supabaseKey.substring(0, 10) + '...'
      },
      tables: tablesData?.map(t => t.table_name) || [],
      servicesTable: {
        exists: !servicesError,
        error: servicesError?.message,
        sampleData: servicesData || [],
        count: servicesData?.length || 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Debug check failed',
      message: error.message
    });
  }
}