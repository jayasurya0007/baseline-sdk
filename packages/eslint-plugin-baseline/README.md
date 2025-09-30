# eslint-plugin-baseline

ESLint rules to prevent usage of non‑Baseline features.

## Install

```bash
npm i -D eslint eslint-plugin-baseline
```

If using this monorepo, the plugin is available locally.

## Configure

`.eslintrc.json`:

```json
{
  "plugins": ["baseline"],
  "rules": {
    "baseline/no-non-baseline": ["error", { "target": "widely" }]
  }
}
```

## What it checks

Currently a minimal demo rule that flags `Array.prototype.toSorted` when below the required baseline.

## Usage

```bash
npx eslint .
```


