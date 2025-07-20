#!/usr/bin/env node
import AccountabilityScheduler from '../lib/scheduler.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

console.log('🚀 Queensland Youth Justice Accountability - Automation Startup')
console.log('==============================================================')
console.log('Initializing automated government accountability monitoring...')

async function startAutomation() {
  try {
    const scheduler = new AccountabilityScheduler()
    
    console.log('\n📅 Starting automated data collection scheduler...')
    await scheduler.start()
    
    console.log('\n✅ AUTOMATION SYSTEM OPERATIONAL')
    console.log('================================')
    console.log('🔄 Real-time monitoring: ACTIVE')
    console.log('📊 Data collection: AUTOMATED')
    console.log('🚨 Alert system: ENABLED')
    console.log('⚖️  Accountability tracking: CONTINUOUS')
    
    console.log('\n📋 Scheduled Tasks:')
    const taskStatus = await scheduler.getTaskStatus()
    taskStatus.forEach(task => {
      console.log(`   ✓ ${task.name}`)
      console.log(`     📅 Schedule: ${task.schedule}`)
      console.log(`     🎯 Priority: ${task.priority}`)
      console.log(`     ⏭️  Next run: ${task.nextRun.toLocaleString()}`)
    })
    
    console.log('\n🎯 ACCOUNTABILITY IMPACT:')
    console.log('========================')
    console.log('• AIHW Indigenous data: Weekly monitoring for 20x overrepresentation changes')
    console.log('• Treasury budget: Weekly tracking of $1.38B allocation transparency')
    console.log('• Children\'s Court: Weekly monitoring of 86% Indigenous representation')
    console.log('• QPS crime stats: Weekly updates on youth crime demographics')
    console.log('• Detention centres: Weekly capacity and demographics tracking')
    console.log('• Court sentencing: Weekly bail and sentencing outcome analysis')
    console.log('• Police data: Weekly youth offender and crime type statistics')
    console.log('• RTI data: Weekly health, education and hidden costs monitoring')
    console.log('• Alert system: Real-time notifications for critical accountability failures')
    
    console.log('\n📢 SYSTEM STATUS: Queensland Government under continuous accountability surveillance')
    console.log('Press Ctrl+C to stop automation (not recommended for production)')
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down accountability automation...')
      await scheduler.stop()
      console.log('✅ Automation stopped. Queensland accountability monitoring offline.')
      process.exit(0)
    })
    
    // Prevent the script from exiting
    setInterval(() => {
      // Keep alive
    }, 60000) // Check every minute
    
  } catch (error) {
    console.error('❌ Failed to start automation:', error.message)
    process.exit(1)
  }
}

// Execute automation startup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startAutomation()
    .catch(error => {
      console.error('💥 Automation startup failed:', error)
      process.exit(1)
    })
}

export { startAutomation }