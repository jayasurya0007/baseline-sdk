# vscode-baseline

VS Code extension that surfaces Baseline diagnostics and hover info in the editor.

## Develop / Run

1) Open `packages/vscode-baseline` in VS Code
2) Run the "Launch Extension" configuration (F5)
3) In the Extension Host window, open a JS/TS/CSS file

You should see diagnostics for non‑Baseline features and hovers for known samples (e.g., `toSorted`).

## Settings

- `baseline.target`: `widely` | `newly` | `limited` (default: `widely`)

## Notes

This demo uses a minimal sample dataset; replace with full Web Features data for production.


