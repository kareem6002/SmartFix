#!/usr/bin/env node
/**
 * SmartFix first-run setup.
 *
 * Run once after unzipping:   node setup.mjs
 *
 * What it does:
 *   - Creates .env from .env.example if you don't have one yet.
 *   - Generates a random JWT_SECRET and ADMIN_PASSWORD and writes them into .env.
 *   - Never prints secrets to the terminal and never changes values you already set.
 *   - Safe to re-run: if everything is already configured it changes nothing.
 *   - Does not touch the database. Existing data and accounts stay as they are.
 *
 * After it finishes:  docker compose up --build
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const PLACEHOLDERS = new Set(['', 'change-me', 'dev-secret', 'changeme']);
const isMissing = (v) => v === undefined || PLACEHOLDERS.has(v.trim().toLowerCase());

function parse(text) {
  // Keep the raw lines so comments and order survive; index the KEY=value lines.
  const lines = text.split(/\r?\n/);
  const values = new Map();
  const keyLine = new Map();
  lines.forEach((line, i) => {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !line.trimStart().startsWith('#')) {
      values.set(m[1], m[2].trim());
      keyLine.set(m[1], i);
    }
  });
  return { lines, values, keyLine };
}

function setValue(doc, key, value) {
  doc.values.set(key, value);
  if (doc.keyLine.has(key)) doc.lines[doc.keyLine.get(key)] = `${key}=${value}`;
  else doc.lines.push(`${key}=${value}`);
}

function main() {
  if (!fs.existsSync(examplePath)) {
    console.error('setup: .env.example not found - run this from the SmartFix project folder.');
    process.exit(1);
  }

  const created = !fs.existsSync(envPath);
  const template = created ? fs.readFileSync(examplePath, 'utf8') : fs.readFileSync(envPath, 'utf8');
  const doc = parse(template);

  const generated = [];
  if (isMissing(doc.values.get('JWT_SECRET'))) {
    setValue(doc, 'JWT_SECRET', crypto.randomBytes(32).toString('hex'));
    generated.push('JWT_SECRET');
  }
  if (isMissing(doc.values.get('ADMIN_PASSWORD'))) {
    setValue(doc, 'ADMIN_PASSWORD', crypto.randomBytes(18).toString('base64url'));
    generated.push('ADMIN_PASSWORD');
  }

  if (created || generated.length) {
    fs.writeFileSync(envPath, doc.lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, ''), { mode: 0o600 });
  }

  if (created) console.log('Created .env from .env.example.');
  if (generated.length) {
    console.log(`Generated fresh random value(s) for: ${generated.join(', ')}.`);
    console.log('They are saved only in .env (never shown here). Open .env to see them.');
  }
  if (!created && !generated.length) {
    console.log('.env already has JWT_SECRET and ADMIN_PASSWORD set. Nothing changed.');
  }

  console.log('\nAdmin account: on first start the server creates admin@smartfix.com using');
  console.log('the ADMIN_PASSWORD in your .env. There is no shared default password.');
  console.log('If the database already has an admin, its password is unchanged.');
  console.log('\nNext steps:');
  console.log('  1. docker compose up --build');
  console.log('  2. App: http://localhost:5173   API: http://localhost:4000/api');
  console.log('\nOptional (edit .env first):');
  console.log('  - SEED_DEMO=true      adds demo accounts (password demo123) for local demos');
  console.log('  - VITE_API_URL        set to your hosted API URL before a public deploy');
}
main();
