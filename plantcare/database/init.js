// database/init.js - Automated PostgreSQL Database Setup Script
// Executes all schema, index, view, function, trigger, and seed scripts in order.

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

const config = {
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

console.log('🌿 =========================================================');
console.log('   VerdeBase (PlantCare 2.0) - Automated Database Setup');
console.log('   =========================================================');
console.log(`📡 Connecting to PostgreSQL at ${config.host}:${config.port}...`);
console.log(`   Target Database: ${config.database}`);
console.log(`   User:            ${config.user}`);
console.log('---------------------------------------------------------');

// Step 1: Ensure database exists by connecting to default 'postgres' database first
async function ensureDatabaseExists() {
  const rootClient = new Client({
    ...config,
    database: 'postgres', // connect to default maintenance DB
  });

  try {
    await rootClient.connect();
    const checkRes = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );

    if (checkRes.rowCount === 0) {
      console.log(`⚙️  Database "${config.database}" does not exist. Creating it now...`);
      await rootClient.query(`CREATE DATABASE "${config.database}"`);
      console.log(`✅ Database "${config.database}" created successfully.`);
    } else {
      console.log(`ℹ️  Database "${config.database}" already exists.`);
    }
  } catch (err) {
    console.warn(`⚠️  Could not auto-create database (may need manual creation or already connected): ${err.message}`);
  } finally {
    await rootClient.end().catch(() => {});
  }
}

// Step 2: Run SQL script files in sequence
const SQL_SCRIPTS = [
  { name: '1. Relational Schema (14 Tables)', file: 'schema.sql' },
  { name: '2. B-Tree Indexes (20+ Indexes)',   file: 'indexes.sql' },
  { name: '3. PostgreSQL Views (6 Views)',      file: 'views.sql' },
  { name: '4. Stored Functions (PL/pgSQL)',     file: 'functions.sql' },
  { name: '5. Event Triggers (5 Triggers)',     file: 'triggers.sql' },
  { name: '6. Seed Data (Realistic Records)',   file: 'seed.sql' },
];

async function runDatabaseInitialization() {
  await ensureDatabaseExists();

  const client = new Client(config);

  try {
    await client.connect();
    console.log(`🔌 Connected to database "${config.database}".`);
    console.log('---------------------------------------------------------');

    for (const step of SQL_SCRIPTS) {
      const filePath = path.resolve(__dirname, step.file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Script file not found: ${filePath}`);
        continue;
      }

      console.log(`⏳ Executing ${step.name}...`);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Execute SQL
      await client.query(sqlContent);
      console.log(`   ✓ Completed ${step.name}`);
    }

    console.log('---------------------------------------------------------');
    console.log('🎉 SUCCESS! VerdeBase PostgreSQL database fully initialized.');
    console.log('');
    console.log('Default Seed Logins:');
    console.log('  👑 Admin User:  admin@verdebase.com / Admin@123');
    console.log('  🌱 Standard:    jane@verdebase.com  / User@123');
    console.log('');
    console.log('Next: Run "npm run dev" and open http://localhost:3000');
    console.log('🌿 =========================================================');
  } catch (err) {
    console.error('');
    console.error('❌ Database Initialization Failed:');
    console.error(err.message);
    if (err.detail) console.error(`Detail: ${err.detail}`);
    if (err.hint) console.error(`Hint: ${err.hint}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that PostgreSQL service is running on your machine.');
    console.error('2. Verify DB_PASSWORD, DB_USER, DB_PORT in your .env file.');
    console.error('3. Make sure database user has permission to CREATE and ALTER.');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runDatabaseInitialization();
