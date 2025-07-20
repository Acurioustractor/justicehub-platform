import { supabase } from '@/lib/supabase/client';

/**
 * Empathy Ledger Integration
 * 
 * This module provides functions to integrate with the Empathy Ledger system,
 * which aggregates data across multiple projects to provide insights and analytics.
 */

interface EmpathyLedgerConfig {
  apiKey: string;
  baseUrl: string;
  projectId: string;
}

/**
 * Fetches stories from the Empathy Ledger system and imports them into the local database
 */
export async function importStoriesFromEmpathyLedger(organizationId: string) {
  try {
    // 1. Get organization's Empathy Ledger config
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();
    
    if (!org?.settings?.empathyLedger) {
      throw new Error('No Empathy Ledger configuration found');
    }
    
    const config = org.settings.empathyLedger as EmpathyLedgerConfig;
    
    // 2. Fetch stories from Empathy Ledger API
    const response = await fetch(`${config.baseUrl}/api/stories`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Project-ID': config.projectId
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const stories = await response.json();
    
    // 3. Import stories into local database
    let successCount = 0;
    let errorCount = 0;
    
    for (const story of stories) {
      try {
        // Check if story already exists
        const { data: existingStory } = await supabase
          .from('stories')
          .select('id')
          .eq('external_id', story.id)
          .eq('source', 'import')
          .single();
        
        if (existingStory) {
          // Update existing story
          await supabase
            .from('stories')
            .update({
              title: story.title,
              content: story.content,
              tags: story.tags || [],
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStory.id);
        } else {
          // Insert new story
          const { error } = await supabase
            .from('stories')
            .insert({
              title: story.title,
              content: story.content,
              external_id: story.id,
              organization_id: organizationId,
              source: 'import',
              visibility: 'organization',
              story_type: story.type || 'personal',
              tags: story.tags || [],
              published: true,
              created_at: story.created_at || new Date().toISOString()
            });
          
          if (error) throw error;
        }
        
        successCount++;
      } catch (err) {
        console.error('Error importing story:', err);
        errorCount++;
      }
    }
    
    // 4. Update sync timestamp
    await supabase
      .from('organizations')
      .update({
        settings: {
          ...org.settings,
          empathyLedger: {
            ...config,
            last_sync: new Date().toISOString()
          }
        }
      })
      .eq('id', organizationId);
    
    return {
      success: true,
      message: `Import completed: ${successCount} stories imported, ${errorCount} errors`,
      successCount,
      errorCount
    };
  } catch (error: any) {
    console.error('Empathy Ledger import error:', error);
    return {
      success: false,
      message: error.message || 'Unknown error during import',
      successCount: 0,
      errorCount: 0
    };
  }
}

/**
 * Exports stories to the Empathy Ledger system
 */
export async function exportStoriesToEmpathyLedger(organizationId: string) {
  try {
    // 1. Get organization's Empathy Ledger config
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();
    
    if (!org?.settings?.empathyLedger) {
      throw new Error('No Empathy Ledger configuration found');
    }
    
    const config = org.settings.empathyLedger as EmpathyLedgerConfig;
    
    // 2. Get stories to export (only those created locally)
    const { data: stories } = await supabase
      .from('stories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source', 'local')
      .eq('published', true);
    
    if (!stories || stories.length === 0) {
      return {
        success: true,
        message: 'No stories to export',
        successCount: 0,
        errorCount: 0
      };
    }
    
    // 3. Export stories to Empathy Ledger API
    const response = await fetch(`${config.baseUrl}/api/stories/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Project-ID': config.projectId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stories: stories.map(story => ({
          external_id: story.id,
          title: story.title,
          content: story.content,
          type: story.story_type,
          tags: story.tags,
          created_at: story.created_at,
          updated_at: story.updated_at
        }))
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 4. Update sync timestamp
    await supabase
      .from('organizations')
      .update({
        settings: {
          ...org.settings,
          empathyLedger: {
            ...config,
            last_export: new Date().toISOString()
          }
        }
      })
      .eq('id', organizationId);
    
    return {
      success: true,
      message: `Export completed: ${result.success} stories exported, ${result.errors} errors`,
      successCount: result.success,
      errorCount: result.errors
    };
  } catch (error: any) {
    console.error('Empathy Ledger export error:', error);
    return {
      success: false,
      message: error.message || 'Unknown error during export',
      successCount: 0,
      errorCount: 0
    };
  }
}

/**
 * Fetches analytics data from the Empathy Ledger system
 */
export async function getEmpathyLedgerAnalytics(organizationId: string) {
  try {
    // 1. Get organization's Empathy Ledger config
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();
    
    if (!org?.settings?.empathyLedger) {
      throw new Error('No Empathy Ledger configuration found');
    }
    
    const config = org.settings.empathyLedger as EmpathyLedgerConfig;
    
    // 2. Fetch analytics from Empathy Ledger API
    const response = await fetch(`${config.baseUrl}/api/analytics`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Project-ID': config.projectId
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Empathy Ledger analytics error:', error);
    throw error;
  }
}