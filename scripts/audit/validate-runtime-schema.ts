import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

type Contract = {
  version: number;
  description?: string;
  tables?: Record<string, string[]>;
  views?: Record<string, string[]>;
};

function resolveContractPath(argPath?: string): string {
  if (!argPath) {
    return path.resolve(process.cwd(), 'docs/contracts/runtime-schema-contract.json');
  }
  return path.isAbsolute(argPath) ? argPath : path.resolve(process.cwd(), argPath);
}

function loadContract(filePath: string): Contract {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Contract file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Contract;
}

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    throw new Error('Missing DB connection env. Set DATABASE_URL (or SUPABASE_DB_URL).');
  }
  return url;
}

async function validateContract(contract: Contract) {
  const tables = contract.tables ?? {};
  const views = contract.views ?? {};
  const relationNames = [...Object.keys(tables), ...Object.keys(views)];

  if (relationNames.length === 0) {
    throw new Error('Contract has no tables/views defined.');
  }

  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  try {
    const existingRelations = await client.query<{
      table_name: string;
      relation_kind: 'BASE TABLE' | 'VIEW';
    }>(
      `
      SELECT table_name, 'BASE TABLE'::text AS relation_kind
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      UNION ALL
      SELECT table_name, 'VIEW'::text AS relation_kind
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      `,
      [relationNames]
    );

    const existingSet = new Set(existingRelations.rows.map((r) => r.table_name));
    const missingRelations = relationNames.filter((name) => !existingSet.has(name));

    const columnRows = await client.query<{ table_name: string; column_name: string }>(
      `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      `,
      [relationNames]
    );

    const columnsByTable = new Map<string, Set<string>>();
    for (const row of columnRows.rows) {
      if (!columnsByTable.has(row.table_name)) {
        columnsByTable.set(row.table_name, new Set());
      }
      columnsByTable.get(row.table_name)?.add(row.column_name);
    }

    const missingColumns: Array<{ relation: string; column: string }> = [];
    const checkColumns = (relations: Record<string, string[]>) => {
      for (const [relation, requiredColumns] of Object.entries(relations)) {
        const available = columnsByTable.get(relation) ?? new Set<string>();
        for (const column of requiredColumns) {
          if (!available.has(column)) {
            missingColumns.push({ relation, column });
          }
        }
      }
    };

    checkColumns(tables);
    checkColumns(views);

    const passed = missingRelations.length === 0 && missingColumns.length === 0;

    console.log('Runtime schema contract validation');
    console.log(`- Contract version: ${contract.version}`);
    console.log(`- Relations checked: ${relationNames.length}`);
    console.log(`- Missing relations: ${missingRelations.length}`);
    console.log(`- Missing columns: ${missingColumns.length}`);

    if (missingRelations.length > 0) {
      console.log('\nMissing relations:');
      for (const relation of missingRelations) {
        console.log(`  - ${relation}`);
      }
    }

    if (missingColumns.length > 0) {
      console.log('\nMissing columns:');
      for (const entry of missingColumns) {
        console.log(`  - ${entry.relation}.${entry.column}`);
      }
    }

    if (!passed) {
      process.exitCode = 1;
      return;
    }

    console.log('\nSchema contract validation passed.');
  } finally {
    await client.end();
  }
}

async function main() {
  const contractPath = resolveContractPath(process.argv[2]);
  const contract = loadContract(contractPath);
  await validateContract(contract);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Unknown error validating schema contract'
  );
  process.exitCode = 1;
});
