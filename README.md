## Baseline Compatibility Toolkit

Baseline Compatibility Toolkit is a full‑stack toolchain to integrate MDN Baseline data into your everyday workflow. It consists of:

- @baseline-toolkit/baseline-sdk: Core SDK to check features and scan code
- @baseline-toolkit/eslint-plugin: ESLint rules to prevent non‑Baseline features
- @baseline-toolkit/baseline-cli: CI/terminal scanner for projects
- @baseline-toolkit/vscode-extension: VS Code extension for diagnostics and hovers

### Monorepo layout

```
packages/
  baseline-sdk/     (@baseline-toolkit/baseline-sdk)
  eslint-plugin-baseline/  (@baseline-toolkit/eslint-plugin)
  baseline-cli/     (@baseline-toolkit/baseline-cli)
  vscode-baseline/  (@baseline-toolkit/vscode-extension)
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


