#!/usr/bin/env node
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWebFeaturesSdk } from './sdk-inline.js';
async function main() {
    const argv = await yargs(hideBin(process.argv))
        .scriptName('baseline-check')
        .usage('$0 <dir> [options]')
        .positional('dir', { describe: 'Directory to scan', type: 'string', default: '.' })
        .option('target', { describe: 'Baseline target', choices: ['limited', 'newly', 'widely'], default: 'widely' })
        .option('ignore', { describe: 'Glob(s) to ignore', type: 'array' })
        .option('json', { describe: 'Output JSON report', type: 'boolean', default: false })
        .option('ai-suggest', { describe: 'Get AI-powered fix suggestions (requires PERPLEXITY_API_KEY)', type: 'boolean', default: false })
        .option('ai-api-key', { describe: 'Perplexity API key (or set PERPLEXITY_API_KEY env var)', type: 'string' })
        .help()
        .parse();
    const target = argv.target ?? 'widely';
    const dir = argv._[0] || '.';
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
            allIssues.push({ file, content, ...issue });
        }
    }
    // AI Suggestions
    const aiSuggest = argv['ai-suggest'];
    let aiFixer = null;
    if (aiSuggest && allIssues.length > 0) {
        const apiKey = argv['ai-api-key'] || process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            console.error('\n⚠️  AI suggestions requested but no API key provided.');
            console.error('Set PERPLEXITY_API_KEY environment variable or use --ai-api-key option.');
            console.error('Get your API key at: https://www.perplexity.ai/\n');
        }
        else {
            try {
                console.log('\n🤖 Loading AI fixer...');
                const { createPerplexityFixer } = await import('@baseline-toolkit/baseline-ai-fixer');
                aiFixer = createPerplexityFixer(apiKey);
                const available = await aiFixer.isAvailable();
                if (!available) {
                    console.error('⚠️  AI provider is not available. Check your API key.\n');
                    aiFixer = null;
                }
                else {
                    console.log('✓ AI fixer ready\n');
                }
            }
            catch (error) {
                console.error('⚠️  Failed to load AI fixer:', error instanceof Error ? error.message : 'Unknown error');
                console.error('Install with: npm install @baseline-toolkit/baseline-ai-fixer\n');
                aiFixer = null;
            }
        }
    }
    // Get AI suggestions if enabled
    if (aiFixer) {
        console.log('🔄 Generating AI suggestions...\n');
        for (const issue of allIssues) {
            try {
                // Extract the problematic code snippet (line with context)
                const lines = issue.content.split('\n');
                const lineIndex = issue.line - 1;
                const codeSnippet = lines.slice(Math.max(0, lineIndex - 1), Math.min(lines.length, lineIndex + 2)).join('\n');
                const suggestion = await aiFixer.suggestFix(codeSnippet, {
                    kind: issue.kind,
                    featureId: issue.featureId,
                    message: issue.message,
                    line: issue.line,
                    column: issue.column
                }, `File: ${issue.file}`);
                issue.aiSuggestion = suggestion;
            }
            catch (error) {
                console.error(`Failed to get AI suggestion for ${issue.featureId}:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
    }
    if (argv.json) {
        console.log(JSON.stringify({ issues: allIssues }, null, 2));
    }
    else {
        for (const issue of allIssues) {
            const loc = `${issue.file}:${issue.line}:${issue.column}`;
            console.error(`\n[31m✖[0m ${loc} – ${issue.message} (${issue.featureId})`);
            if (issue.aiSuggestion) {
                console.error(`\n  [36m💡 AI Suggestion (${issue.aiSuggestion.confidence} confidence):[0m`);
                console.error(`  ${issue.aiSuggestion.explanation}\n`);
                console.error(`  [90mOriginal:[0m`);
                console.error(`  ${issue.aiSuggestion.originalCode.split('\n').map((l) => `  ${l}`).join('\n')}\n`);
                console.error(`  [32mSuggested:[0m`);
                console.error(`  ${issue.aiSuggestion.suggestedCode.split('\n').map((l) => `  ${l}`).join('\n')}`);
            }
        }
        if (allIssues.length) {
            console.error(`\n[31mBaseline check failed (${allIssues.length} errors).[0m`);
            if (aiSuggest && !aiFixer) {
                console.error('\n💡 Tip: Set up AI suggestions with --ai-suggest and PERPLEXITY_API_KEY for fix recommendations.');
            }
        }
        else {
            console.log('\n[32m✓ Baseline check passed.[0m');
        }
    }
    process.exit(allIssues.length ? 1 : 0);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map