#!/usr/bin/env node
/**
 * Schema Cache Refresh Timer
 * 
 * Tracks when the Supabase schema cache should refresh automatically
 */

function schemaCacheTimer() {
  console.log('⏱️ Schema Cache Refresh Timer')
  console.log('===============================')
  
  const startTime = new Date()
  const refreshTime = new Date(startTime.getTime() + 15 * 60 * 1000) // 15 minutes
  
  console.log(`Started at: ${startTime.toLocaleTimeString()}`)
  console.log(`Expected refresh: ${refreshTime.toLocaleTimeString()}`)
  console.log('')
  
  // Update every 30 seconds
  const timer = setInterval(() => {
    const now = new Date()
    const timeRemaining = refreshTime.getTime() - now.getTime()
    
    if (timeRemaining <= 0) {
      console.log('🎉 SCHEMA CACHE SHOULD BE REFRESHED!')
      console.log('Try running the scraper now:')
      console.log('npx tsx src/scripts/run-test-scrape.ts')
      clearInterval(timer)
      return
    }
    
    const minutes = Math.floor(timeRemaining / (1000 * 60))
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)
    
    // Clear previous line and show updated time
    process.stdout.write(`\r⏰ Time remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, 1000)
  
  console.log('\nPress Ctrl+C to stop timer')
}

// Start the timer
schemaCacheTimer()
