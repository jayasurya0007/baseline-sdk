#!/usr/bin/env node
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';
async function main() {
    const argv = await yargs(hideBin(process.argv))
        .scriptName('baseline-check')
        .usage('$0 <dir> [options]')
        .positional('dir', { describe: 'Directory to scan', type: 'string', default: '.' })
        .option('target', { describe: 'Baseline target', choices: ['limited', 'newly', 'widely'], default: 'widely' })
        .option('ignore', { describe: 'Glob(s) to ignore', type: 'array' })
        .option('json', { describe: 'Output JSON report', type: 'boolean', default: false })
        .help()
        .parse();
    const target = argv.target ?? 'widely';
    const dir = argv._[0] || '.';
    const sdk = createDefaultSdk(target);
    const defaultIgnores = [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/out/**'
    ];
    const userIgnores = (argv.ignore || []).map(g => g.replace(/\\/g, '/'));
    const patterns = [
        path.join(dir, '**/*.{js,jsx,ts,tsx,css}').replace(/\\/g, '/'),
        ...[...defaultIgnores, ...userIgnores].map(g => '!' + path.join(dir, g).replace(/\\/g, '/'))
    ];
    const files = await fg(patterns, { dot: false, onlyFiles: true });
    const allIssues = [];
    for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const result = await sdk.scanCode(content, { target });
        for (const issue of result.issues) {
            allIssues.push({ file, ...issue });
        }
    }
    if (argv.json) {
        console.log(JSON.stringify({ issues: allIssues }, null, 2));
    }
    else {
        for (const issue of allIssues) {
            const loc = `${issue.file}:${issue.line}:${issue.column}`;
            console.error(`[31m✖[0m ${loc} – ${issue.message} (${issue.featureId})`);
        }
        if (allIssues.length) {
            console.error(`\nBaseline check failed (${allIssues.length} errors).`);
        }
        else {
            console.log('Baseline check passed.');
        }
    }
    process.exit(allIssues.length ? 1 : 0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map