# baseline-cli

Command‑line Baseline scanner for CI and local use.

## Install

```bash
npm i -D baseline-cli
```

In this monorepo you can invoke the built file directly.

## Usage

```bash
baseline-check <dir> [--target widely|newly|limited] [--json]

# examples
baseline-check ./src --target widely
baseline-check . --json
```

Exit code is 1 when violations are found.

## CI examples

### GitHub Actions

```yaml
- name: Baseline check
  run: npx baseline-check . --target widely
```

### npm script

```json
{
  "scripts": {
    "baseline": "baseline-check . --target widely"
  }
}
```


