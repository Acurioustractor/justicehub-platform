import { supabase } from '@/lib/supabase/client'
import Airtable from 'airtable'

export interface AirtableConfig {
  apiKey: string
  baseId: string
  tableId: string
}

export async function syncAirtableStories(organizationId: string) {
  try {
    // 1. Get organization's Airtable config
    const { data: org } = await supabase
      .from('organizations')
      .select('airtable_config')
      .eq('id', organizationId)
      .single()
    
    if (!org?.airtable_config) {
      throw new Error('No Airtable configuration found')
    }
    
    const { apiKey, baseId, tableId } = org.airtable_config as AirtableConfig
    
    // 2. Connect to Airtable
    const base = new Airtable({ apiKey }).base(baseId)
    
    // 3. Fetch records
    const records = await base(tableId).select().all()
    
    // 4. Transform and insert/update stories
    let successCount = 0
    let errorCount = 0
    
    for (const record of records) {
      try {
        const storyData = {
          title: record.get('Title') as string,
          content: record.get('Content') as string,
          external_id: record.id,
          organization_id: organizationId,
          source: 'airtable',
          visibility: 'organization',
          story_type: (record.get('Type') as string) || 'personal',
          tags: (record.get('Tags') as string[]) || [],
          published: true,
          created_at: (record.get('Created') as string) || new Date().toISOString()
        }
        
        // Upsert story
        const { data: story, error } = await supabase
          .from('stories')
          .upsert({
            ...storyData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'external_id',
            ignoreDuplicates: false
          })
          .select()
          .single()
        
        if (error) {
          console.error('Error upserting story:', error.message)
          errorCount++
          continue
        }
        
        // Handle attachments if any
        const attachments = record.get('Attachments') as any[]
        if (attachments && Array.isArray(attachments)) {
          for (const attachment of attachments) {
            // Create media record pointing to Airtable URL
            await supabase
              .from('story_media')
              .insert({
                story_id: story.id,
                storage_path: attachment.url,
                media_type: attachment.type || 'image/jpeg',
                external_url: true
              })
          }
        }
        
        successCount++
      } catch (err) {
        console.error('Error processing record:', err)
        errorCount++
      }
    }
    
    // 5. Update sync timestamp
    await supabase
      .from('organizations')
      .update({
        airtable_config: {
          ...org.airtable_config,
          last_sync: new Date().toISOString()
        }
      })
      .eq('id', organizationId)
    
    return {
      success: true,
      message: `Sync completed: ${successCount} stories synced, ${errorCount} errors`,
      successCount,
      errorCount
    }
  } catch (error: any) {
    console.error('Airtable sync error:', error)
    return {
      success: false,
      message: error.message || 'Unknown error during sync',
      successCount: 0,
      errorCount: 0
    }
  }
}