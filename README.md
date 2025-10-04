## Baseline Compatibility Toolkit

Baseline Compatibility Toolkit is a full‑stack toolchain to integrate MDN Baseline data into your everyday workflow. It consists of:

- @baseline-toolkit/baseline-sdk: Core SDK to check features and scan code
- @baseline-toolkit/eslint-plugin: ESLint rules to prevent non‑Baseline features
- @baseline-toolkit/baseline-cli: CI/terminal scanner for projects
- @baseline-toolkit/vscode-extension: VS Code extension for diagnostics and hovers
- **@baseline-toolkit/baseline-ai-fixer: 🤖 AI-powered fix suggestions using Perplexity AI** ✨ NEW!

### Monorepo layout

```
packages/
  baseline-sdk/           (@baseline-toolkit/baseline-sdk)
  eslint-plugin-baseline/ (@baseline-toolkit/eslint-plugin)
  baseline-cli/           (@baseline-toolkit/baseline-cli)
  vscode-baseline/        (@baseline-toolkit/vscode-extension)
  baseline-ai-fixer/      (@baseline-toolkit/baseline-ai-fixer) ✨ NEW!
```

### Quick start

1) Install deps and build all packages

```bash
npm install
npm run build
```

2) Try the CLI

```bash
node packages/baseline-cli/dist/index.js ./ --target widely
```

2a) **NEW: Try AI-powered suggestions** 🤖

```bash
# Set your Perplexity API key
export PERPLEXITY_API_KEY=your_api_key_here

# Run with AI suggestions
node packages/baseline-cli/dist/index.js ./ --target widely --ai-suggest
```

See [SETUP_AI.md](SETUP_AI.md) for quick setup and [AI_INTEGRATION_GUIDE.md](AI_INTEGRATION_GUIDE.md) for complete documentation.

3) ESLint plugin

Add to your ESLint config:

```json
{
  "plugins": ["@baseline-toolkit/eslint-plugin"],
  "rules": {
    "@baseline-toolkit/eslint-plugin/no-non-baseline": "error"
  }
}
```

4) VS Code extension

Open `packages/vscode-baseline` in VS Code and run the Extension Host (F5). Configure `baseline.target` in settings.

For details, see per‑package READMEs below.


