import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { globSync } from 'glob'

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.d.ts']
const SKIP_EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.json',
  '.md',
  '.mdx',
])

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    output: null,
    extends: './tsconfig.json',
    entry: [],
    exclude: [],
    includeAmbientTypes: true,
    reportHubs: 0,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]
    if (arg === '--root' && next) {
      args.root = path.resolve(next)
      i += 1
    } else if (arg === '--output' && next) {
      args.output = path.resolve(args.root, next)
      i += 1
    } else if (arg === '--extends' && next) {
      args.extends = next
      i += 1
    } else if (arg === '--entry' && next) {
      args.entry.push(next)
      i += 1
    } else if (arg === '--exclude' && next) {
      args.exclude.push(next)
      i += 1
    } else if (arg === '--no-ambient-types') {
      args.includeAmbientTypes = false
    } else if (arg === '--report-hubs' && next) {
      args.reportHubs = Number(next)
      i += 1
    }
  }

  if (!args.output) {
    throw new Error('Missing required --output argument')
  }

  if (args.entry.length === 0) {
    throw new Error('At least one --entry glob is required')
  }

  return args
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

function resolveAlias(specifier, fromFile) {
  if (specifier.startsWith('@/')) {
    return path.join('src', specifier.slice(2))
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return path.join(path.dirname(fromFile), specifier)
  }

  return null
}

function resolveSourceFile(root, candidate) {
  const normalized = path.normalize(candidate)
  const extension = path.extname(normalized)

  if (extension && SKIP_EXTENSIONS.has(extension)) {
    return null
  }

  const directPath = path.resolve(root, normalized)
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return toPosix(path.relative(root, directPath))
  }

  if (!extension) {
    for (const sourceExtension of SOURCE_EXTENSIONS) {
      const filePath = `${directPath}${sourceExtension}`
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return toPosix(path.relative(root, filePath))
      }
    }
  }

  const directoryPath = extension ? null : directPath
  if (directoryPath && fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory()) {
    for (const sourceExtension of SOURCE_EXTENSIONS) {
      const indexPath = path.join(directoryPath, `index${sourceExtension}`)
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return toPosix(path.relative(root, indexPath))
      }
    }
  }

  return null
}

function extractSpecifiers(fileContent) {
  const specifiers = new Set()
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(fileContent)) !== null) {
      specifiers.add(match[1])
    }
  }

  return [...specifiers]
}

function collectEntryFiles(root, patterns, ignorePatterns) {
  const files = new Set()
  for (const pattern of patterns) {
    const matches = globSync(pattern, {
      cwd: root,
      nodir: true,
      ignore: ignorePatterns,
      windowsPathsNoEscape: true,
    })
    for (const match of matches) {
      files.add(toPosix(match))
    }
  }
  return [...files].sort()
}

function buildIncludeList(root, entryFiles, includeAmbientTypes) {
  const queue = [...entryFiles]
  const visited = new Set()
  const incomingCounts = new Map()

  while (queue.length > 0) {
    const current = queue.pop()
    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)
    const absolutePath = path.resolve(root, current)
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      continue
    }

    const content = fs.readFileSync(absolutePath, 'utf8')
    const specifiers = extractSpecifiers(content)

    for (const specifier of specifiers) {
      const candidate = resolveAlias(specifier, current)
      if (!candidate) {
        continue
      }

      const resolved = resolveSourceFile(root, candidate)
      if (!resolved) {
        continue
      }

      if (resolved.startsWith('src/')) {
        incomingCounts.set(resolved, (incomingCounts.get(resolved) ?? 0) + 1)
        queue.push(resolved)
      }
    }
  }

  const include = ['next-env.d.ts', ...visited]

  if (includeAmbientTypes) {
    const ambientTypeFiles = globSync('src/types/**/*.d.ts', {
      cwd: root,
      nodir: true,
      windowsPathsNoEscape: true,
    }).sort()
    include.push(...ambientTypeFiles.map(toPosix))
  }

  return {
    include: [...new Set(include)].sort(),
    incomingCounts,
  }
}

function writeConfig(outputPath, extendsPath, include) {
  const config = {
    extends: extendsPath,
    compilerOptions: {
      incremental: false,
    },
    include,
    exclude: ['node_modules', 'dist', 'artifacts', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`)
}

export function runGeneration(options) {
  const args = {
    ...options,
    root: path.resolve(options.root ?? process.cwd()),
    output: path.resolve(options.root ?? process.cwd(), options.output),
    entry: options.entry ?? [],
    exclude: options.exclude ?? [],
    extends: options.extends ?? './tsconfig.json',
    includeAmbientTypes: options.includeAmbientTypes ?? true,
  }

  const entryFiles = collectEntryFiles(args.root, args.entry, args.exclude)
  const { include, incomingCounts } = buildIncludeList(args.root, entryFiles, args.includeAmbientTypes)
  writeConfig(args.output, args.extends, include)

  const topHubs =
    args.reportHubs > 0
      ? [...incomingCounts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, args.reportHubs)
          .map(([file, imports]) => ({ file, imports }))
      : []

  return {
    output: toPosix(path.relative(args.root, args.output)),
    entryCount: entryFiles.length,
    includeCount: include.length,
    topHubs,
  }
}

function main() {
  const parsed = parseArgs(process.argv.slice(2))
  const result = runGeneration(parsed)
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
