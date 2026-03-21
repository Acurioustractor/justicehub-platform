import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import { runGeneration } from './generate-import-lane.mjs'

const root = process.cwd()

function readFile(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8')
}

function collectDirectImportEntries({ patterns, exclude = [], importMatchers }) {
  const candidates = new Set()

  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      cwd: root,
      nodir: true,
      ignore: exclude,
      windowsPathsNoEscape: true,
    })

    for (const match of matches) {
      candidates.add(match.split(path.sep).join('/'))
    }
  }

  const entries = [...candidates].filter((file) => {
    const content = readFile(file)
    return importMatchers.some((matcher) => matcher.test(content))
  })

  return entries.sort()
}

const adminNavigationEntries = collectDirectImportEntries({
  patterns: ['src/app/admin/**/*.ts', 'src/app/admin/**/*.tsx'],
  exclude: [
    'src/app/admin/alma/**',
    'src/app/admin/data-health/**',
    'src/app/admin/data-operations/**',
    'src/app/admin/funding/**',
    'src/app/admin/governed-proof/**',
    'src/app/admin/org-hub/**',
    'src/app/admin/sync-empathy-ledger/**',
  ],
  importMatchers: [/['"]@\/components\/ui\/navigation['"]/],
})

const apiContentSupabaseEntries = collectDirectImportEntries({
  patterns: [
    'src/app/api/analytics/**/*.ts',
    'src/app/api/australian-frameworks/**/*.ts',
    'src/app/api/basecamps/**/*.ts',
    'src/app/api/coe/**/*.ts',
    'src/app/api/coe-leaders/**/*.ts',
    'src/app/api/community-programs/**/*.ts',
    'src/app/api/contained/**/*.ts',
    'src/app/api/featured-profiles/**/*.ts',
    'src/app/api/featured-stories/**/*.ts',
    'src/app/api/homepage-stats/**/*.ts',
    'src/app/api/justice-funding/**/*.ts',
    'src/app/api/justice-matrix/**/*.ts',
    'src/app/api/justice-spending/**/*.ts',
    'src/app/api/network-nodes/**/*.ts',
    'src/app/api/power-page/**/*.ts',
    'src/app/api/related-content/**/*.ts',
    'src/app/api/research-items/**/*.ts',
    'src/app/api/stories/**/*.ts',
  ],
  exclude: [
    'src/app/api/billing/webhook/**',
    'src/app/api/cron/**',
    'src/app/api/empathy-ledger/**',
    'src/app/api/ghl/webhook/**',
    'src/app/api/health/empathy-ledger/**',
    'src/app/api/intelligence/**',
    'src/app/api/org-hub/**',
    'src/app/api/search/**',
    'src/app/api/signal-engine/**',
    'src/app/api/sync/empathy-ledger/**',
  ],
  importMatchers: [
    /['"]@\/lib\/supabase\/service(?:-lite)?['"]/,
    /['"]@\/lib\/supabase\/server(?:-lite)?['"]/,
    /['"]@\/lib\/supabase\/empathy-ledger(?:-lite)?['"]/,
  ],
})

const apiCoreSupabaseEntries = collectDirectImportEntries({
  patterns: [
    'src/app/api/admin/**/*.ts',
    'src/app/api/auth/**/*.ts',
    'src/app/api/campaign/**/*.ts',
    'src/app/api/claims/**/*.ts',
    'src/app/api/contact/**/*.ts',
    'src/app/api/dev/**/*.ts',
    'src/app/api/enrich/**/*.ts',
    'src/app/api/hub/**/*.ts',
    'src/app/api/media/**/*.ts',
    'src/app/api/organizations/**/*.ts',
    'src/app/api/programs/**/*.ts',
    'src/app/api/projects/**/*.ts',
    'src/app/api/reports/**/*.ts',
    'src/app/api/scraped-services/**/*.ts',
    'src/app/api/services/**/*.ts',
    'src/app/api/transparency/**/*.ts',
    'src/app/api/upload-image/**/*.ts',
    'src/app/api/users/**/*.ts',
  ],
  exclude: [
    'src/app/api/admin/governed-proof/**',
    'src/app/api/admin/org-hub/**',
    'src/app/api/admin/sync-empathy-ledger/**',
    'src/app/api/billing/webhook/**',
    'src/app/api/cron/**',
    'src/app/api/empathy-ledger/**',
    'src/app/api/ghl/webhook/**',
    'src/app/api/health/empathy-ledger/**',
    'src/app/api/intelligence/**',
    'src/app/api/org-hub/**',
    'src/app/api/search/**',
    'src/app/api/signal-engine/**',
    'src/app/api/sync/empathy-ledger/**',
  ],
  importMatchers: [
    /['"]@\/lib\/supabase\/admin(?:-lite)?['"]/,
    /['"]@\/lib\/supabase\/service(?:-lite)?['"]/,
    /['"]@\/lib\/supabase\/server(?:-lite)?['"]/,
    /['"]@\/lib\/supabase\/empathy-ledger(?:-lite)?['"]/,
  ],
})

const laneDefinitions = [
  {
    name: 'admin-navigation-hub',
    output: 'tsconfig.admin-navigation-hub.json',
    entry: adminNavigationEntries,
  },
  {
    name: 'api-content-supabase-hub',
    output: 'tsconfig.api-content-supabase-hub.json',
    entry: apiContentSupabaseEntries,
  },
  {
    name: 'api-core-supabase-hub',
    output: 'tsconfig.api-core-supabase-hub.json',
    entry: apiCoreSupabaseEntries,
  },
]

for (const lane of laneDefinitions) {
  const result = runGeneration({
    root,
    output: lane.output,
    entry: lane.entry,
  })

  console.log(
    JSON.stringify(
      {
        lane: lane.name,
        directEntryCount: lane.entry.length,
        ...result,
      },
      null,
      2
    )
  )
}
