import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) throw new Error('DATABASE_URL no está definida. Crea .env.local antes de ejecutar la migración.');
  const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find(value => value.startsWith('DATABASE_URL='));
  const value = line?.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  if (!value) throw new Error('DATABASE_URL no está definida.');
  return value;
}

const sql = neon(readDatabaseUrl());
const migrationDirectory = path.resolve('database/migrations');
const migrations = fs.readdirSync(migrationDirectory).filter(file => file.endsWith('.sql')).sort();

for (const file of migrations) {
  const statements = fs.readFileSync(path.join(migrationDirectory, file), 'utf8')
    .replace(/^--.*$/gm, '')
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.trim())
    .filter(Boolean);

  for (const statement of statements) await sql.query(statement);
  console.log(`✓ ${file}`);
}
