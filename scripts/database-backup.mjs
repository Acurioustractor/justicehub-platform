#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';
import dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Keep last 30 backups

// Tables to backup (in dependency order)
const TABLES = [
  'youth_statistics',
  'budget_allocations',
  'court_statistics',
  'parliamentary_documents',
  'scraped_content',
  'cost_comparisons',
  'hidden_costs',
  'audit_logs',
  'data_versions'
];

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('❌ Failed to create backup directory:', error.message);
    process.exit(1);
  }
}

// Get table schema information
async function getTableSchema(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.warn(`⚠️ Warning: Could not get schema for ${tableName}: ${error.message}`);
    return null;
  }

  return data && data.length > 0 ? Object.keys(data[0]) : [];
}

// Backup a single table
async function backupTable(tableName, backupPath) {
  console.log(`📦 Backing up table: ${tableName}...`);

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Error getting count for ${tableName}:`, countError.message);
      return { success: false, count: 0 };
    }

    console.log(`   Records to backup: ${count || 0}`);

    if (!count || count === 0) {
      // Create empty backup file for table with no data
      const emptyBackup = { tableName, schema: await getTableSchema(tableName), data: [] };
      await fs.writeFile(
        path.join(backupPath, `${tableName}.json`),
        JSON.stringify(emptyBackup, null, 2)
      );
      return { success: true, count: 0 };
    }

    // Backup in chunks for large tables
    const CHUNK_SIZE = 1000;
    const chunks = Math.ceil(count / CHUNK_SIZE);
    const allData = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = start + CHUNK_SIZE - 1;

      console.log(`   Chunk ${i + 1}/${chunks} (records ${start}-${Math.min(end, count - 1)})`);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(start, end)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`❌ Error backing up ${tableName} chunk ${i + 1}:`, error.message);
        return { success: false, count: 0 };
      }

      allData.push(...(data || []));

      // Small delay to avoid rate limiting
      if (i < chunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Save backup file
    const backup = {
      tableName,
      schema: Object.keys(allData[0] || {}),
      recordCount: allData.length,
      backupDate: new Date().toISOString(),
      data: allData
    };

    const fileName = `${tableName}.json`;
    await fs.writeFile(
      path.join(backupPath, fileName),
      JSON.stringify(backup, null, 2)
    );

    console.log(`   ✅ Backed up ${allData.length} records`);
    return { success: true, count: allData.length };

  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return { success: false, count: 0 };
  }
}

// Create compressed archive
async function createCompressedBackup(backupPath, timestamp) {
  console.log('\n📦 Creating compressed archive...');

  const archiveName = `backup-${timestamp}.tar.gz`;
  const archivePath = path.join(BACKUP_DIR, archiveName);

  try {
    // Create tar.gz archive (simplified approach - just zip the JSON files)
    const { createReadStream } = await import('fs');
    const archiver = await import('archiver');
    
    const output = createWriteStream(archivePath);
    const archive = archiver.default('tar', { gzip: true });

    archive.pipe(output);

    // Add all JSON files
    const files = await fs.readdir(backupPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        archive.file(path.join(backupPath, file), { name: file });
      }
    }

    await archive.finalize();

    const stats = await fs.stat(archivePath);
    console.log(`✅ Created compressed backup: ${archiveName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    return archiveName;
  } catch (error) {
    console.error('❌ Error creating compressed backup:', error.message);
    return null;
  }
}

// Create backup manifest
async function createManifest(timestamp, results, archiveName) {
  const manifest = {
    backupDate: new Date().toISOString(),
    timestamp,
    database: {
      url: supabaseUrl,
      instance: supabaseUrl.split('//')[1].split('.')[0]
    },
    tables: results.map(r => ({
      name: r.tableName,
      recordCount: r.count,
      success: r.success
    })),
    totalRecords: results.reduce((sum, r) => sum + r.count, 0),
    archiveName,
    backupSize: archiveName ? await getFileSize(path.join(BACKUP_DIR, archiveName)) : null
  };

  const manifestPath = path.join(BACKUP_DIR, `manifest-${timestamp}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

// Get file size in MB
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return 'Unknown';
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  console.log('\n🧹 Cleaning up old backups...');

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.tar.gz'))
      .sort()
      .reverse(); // Newest first

    if (backupFiles.length > MAX_BACKUPS) {
      const filesToDelete = backupFiles.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        await fs.unlink(path.join(BACKUP_DIR, file));
        
        // Also delete corresponding manifest
        const manifestFile = file.replace('backup-', 'manifest-').replace('.tar.gz', '.json');
        try {
          await fs.unlink(path.join(BACKUP_DIR, manifestFile));
        } catch {
          // Manifest might not exist
        }
        
        console.log(`   Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Warning: Could not clean up old backups:', error.message);
  }
}

// Main backup function
async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = path.join(BACKUP_DIR, `temp-${timestamp}`);

  console.log(`🚀 Starting database backup - ${new Date().toISOString()}\n`);

  try {
    await ensureBackupDir();
    await fs.mkdir(backupPath, { recursive: true });

    const results = [];

    // Backup each table
    for (const tableName of TABLES) {
      const result = await backupTable(tableName, backupPath);
      results.push({ tableName, ...result });
    }

    // Create compressed archive
    const archiveName = await createCompressedBackup(backupPath, timestamp);

    // Create manifest
    const manifest = await createManifest(timestamp, results, archiveName);

    // Clean up temporary directory
    await fs.rm(backupPath, { recursive: true, force: true });

    // Clean up old backups
    await cleanupOldBackups();

    // Summary
    console.log('\n📊 Backup Summary:');
    console.log('═'.repeat(50));
    console.log(`✅ Backup completed successfully`);
    console.log(`📁 Archive: ${archiveName}`);
    console.log(`📄 Manifest: manifest-${timestamp}.json`);
    console.log(`📊 Total tables: ${results.length}`);
    console.log(`📈 Total records: ${manifest.totalRecords}`);
    console.log(`💾 Backup size: ${manifest.backupSize}`);

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log(`⚠️ Failed tables: ${failed.map(f => f.tableName).join(', ')}`);
    }

    return manifest;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // Clean up on failure
    try {
      await fs.rm(backupPath, { recursive: true, force: true });
    } catch {}
    
    process.exit(1);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📦 Database Backup Tool

Usage:
  node database-backup.mjs [options]

Options:
  --help, -h     Show this help message
  --list         List available backups
  --cleanup      Clean up old backups only

Examples:
  node database-backup.mjs          # Perform full backup
  node database-backup.mjs --list   # List backups
`);
    process.exit(0);
  }

  if (args.includes('--list')) {
    try {
      const files = await fs.readdir(BACKUP_DIR);
      const backups = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.tar.gz'))
        .sort()
        .reverse();

      console.log('\n📋 Available Backups:');
      console.log('═'.repeat(50));
      
      for (const backup of backups) {
        const size = await getFileSize(path.join(BACKUP_DIR, backup));
        const date = backup.replace('backup-', '').replace('.tar.gz', '');
        console.log(`📦 ${backup} (${size}) - ${date}`);
      }
      
      if (backups.length === 0) {
        console.log('No backups found.');
      }
    } catch (error) {
      console.error('❌ Error listing backups:', error.message);
    }
    process.exit(0);
  }

  if (args.includes('--cleanup')) {
    await ensureBackupDir();
    await cleanupOldBackups();
    console.log('✅ Cleanup completed');
    process.exit(0);
  }

  // Perform backup
  await performBackup();
}

main().catch(console.error);