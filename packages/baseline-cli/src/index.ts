#!/usr/bin/env node
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWebFeaturesSdk } from '@baseline-toolkit/baseline-sdk';

type BaselineLevel = 'limited' | 'newly' | 'widely';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('baseline-check')
    .usage('$0 <dir> [options]')
    .positional('dir', { describe: 'Directory to scan', type: 'string', default: '.' })
    .option('target', { describe: 'Baseline target', choices: ['limited', 'newly', 'widely'] as const, default: 'widely' })
    .option('ignore', { describe: 'Glob(s) to ignore', type: 'array' })
    .option('json', { describe: 'Output JSON report', type: 'boolean', default: false })
    .help()
    .parse();

  const target = (argv.target as BaselineLevel) ?? 'widely';
  const dir = (argv._[0] as string) || '.';
  // Use the full web-features dataset for comprehensive detection (1000+ features!)
  console.log('🔍 Loading comprehensive web features dataset...');
  const sdk = await createWebFeaturesSdk();

  const defaultIgnores = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/out/**'
  ];
  const userIgnores = ((argv.ignore as string[] | undefined) || []).map(g => g.replace(/\\/g, '/'));
  
  // Check if the input is a file or directory
  const resolvedDir = path.resolve(dir);
  const stat = await fs.stat(resolvedDir).catch(() => null);
  let files: string[];
  
  if (stat?.isFile()) {
    // Single file
    files = [resolvedDir];
  } else if (stat?.isDirectory()) {
    // Directory - use glob patterns
    const patterns = [
      path.join(resolvedDir, '**/*.{js,jsx,ts,tsx,css}').replace(/\\/g, '/'),
      ...[...defaultIgnores, ...userIgnores].map(g => '!' + path.join(resolvedDir, g).replace(/\\/g, '/'))
    ];
    files = await fg(patterns, { dot: false, onlyFiles: true });
  } else {
    files = [];
  }

  const allIssues: any[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const result = await sdk.scanCode(content, { target });
    for (const issue of result.issues) {
      allIssues.push({ file, ...issue });
    }
  }

  if (argv.json) {
    console.log(JSON.stringify({ issues: allIssues }, null, 2));
  } else {
    for (const issue of allIssues) {
      const loc = `${issue.file}:${issue.line}:${issue.column}`;
      console.error(`[31m✖[0m ${loc} – ${issue.message} (${issue.featureId})`);
    }
    if (allIssues.length) {
      console.error(`\nBaseline check failed (${allIssues.length} errors).`);
    } else {
      console.log('Baseline check passed.');
    }
  }

  process.exit(allIssues.length ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

