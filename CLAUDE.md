# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # serve at http://127.0.0.1:4173/ (Python http.server)
npm test               # static smoke-test then Playwright browser tests
npm run test:static    # node scripts/smoke-test.mjs only
npm run test:browser   # Playwright only
npm run manual:render  # quarto render manual-src → copy output to manual/
```

First-time Playwright setup:
```bash
npx playwright install chromium
```

Run a single Playwright test by title:
```bash
npx playwright test --grep "editor execution"
```

## Architecture

**Single-file app.** All application logic lives in `index.html` (~3100 lines). There is no build step and no bundler — GitHub Pages serves it as-is. The JS block is a single `<script type="module">` at the bottom of the file.

### Central state

`state` (line ~1271) is the single source of truth. Key sub-trees:

- `state.app.workbook.sheets[]` — spreadsheet data (row-major 2-D array of strings)
- `state.app.script` — editor textarea content
- `state.app.console.{entries, history}` — console log and REPL history
- `state.app.ui` — current page, active output tab, status text, etc.
- `state.app.dataframes` — R data.frame list and selected preview
- `state.webR` — the live WebR instance (set during `boot()`)
- `state.ready` / `state.busy` — guard flags; code refuses to run when either is wrong

`elements` (line ~1289) holds all `getElementById` references.

### R execution flow

1. `runRCode()` — central entry point; syncs data and runs code
2. `syncWorkbookToR()` calls `buildWorkbookRLiteral()` which calls `sheetToFrameModel()` to convert each sheet's grid into typed R vectors, then assigns them to `.GlobalEnv` along with `get.input` helper
3. `executeRSource()` calls `shelter.captureR()` with `source(..., print.eval=TRUE)` wrapping — this is how top-level expression output is captured
4. Graphics are captured via `captureGraphics` in `captureR()`; the streaming canvas patches from `webR.stream()` are intentionally ignored (see `handleCanvasMessage`)
5. After execution, `refreshDataFrameState()` scans `.GlobalEnv` for data.frames to update the DataFrame tab

### `get.input()` design

`syncWorkbookToR()` injects all sheets as a named list `.__webr_sheets__` into R. The `get.input` function (defined in the same sync) reads from that list. Column type inference (`inferColumnType`) happens on the JS side before passing to R.

### webR version

Pinned to `v0.6.0` via CDN import: `https://webr.r-wasm.org/v0.6.0/webr.mjs`. Do not change this without testing thoroughly — later versions have had breaking changes.

### Export / import format

JSON version 2 (`payload.version === 2`). Shape validated by `validateAppPayload()` and normalised by `normaliseImportedPayload()`. Stores full UI state, console history, workbook sheets, and the editor script.

### Samples

`samples/manifest.json` lists sample IDs and filenames. Each sample is a standalone JSON export (same format as user exports). Loaded on demand via `loadSampleById()`.

### Manual

`manual-src/` — Quarto source (`.qmd` files + `_quarto.yml`).  
`manual/` — rendered static output committed to the repo and served from GitHub Pages.  
After editing `.qmd` files, run `npm run manual:render` to regenerate `manual/`.

### Tests

`tests/app.spec.mjs` contains two Playwright tests (both run sequentially, `fullyParallel: false`):
1. Full happy-path: navigation, webR boot, sample load, script execution, graph render, full-screen viewer, JSON export/import round-trip, manual page
2. Spreadsheet paste, editor execution with multiple data.frames, DataFrame tab preview

`PLAYWRIGHT_BASE_URL` env var overrides the test target (defaults to `http://127.0.0.1:4173`).
