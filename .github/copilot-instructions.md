# Copilot Instructions — StreamGuard

## Project Overview

StreamGuard is a **VS Code extension** that visually hides sensitive code during live streams using the `TextEditorDecorationType` API. It never modifies source files — all hiding is purely decorative.

## Architecture

The extension follows a layered architecture rooted in `src/`:

- **Entry point**: [src/extension.ts](src/extension.ts) — `activate()` wires up the status bar, commands, config watchers, document open/close listeners, and editor-change listeners; `deactivate()` disposes resources.
- **Orchestrator**: [src/guard/guard-manager.ts](src/guard/guard-manager.ts) — `refreshEditor()` is the core pipeline: read cached config → check file/folder glob patterns → look up cached parse results → apply decorations. Maintains a `rangeCache` (per-document `MaskedRange[]`) and a `configCache` to avoid redundant work. `preCacheDocument()` eagerly parses open documents; `evictCacheForDocument()` invalidates on close/edit.
- **Comment parser**: [src/guard/comment-parser.ts](src/guard/comment-parser.ts) — stateless function `parseGuardComments(lines, languageId?)` returns `ParseResult` containing `MaskedRange[]`. Supports `@stream-guard-next`, `@stream-guard-inline`, `@stream-guard-start`/`@stream-guard-end`.
- **Decoration provider**: [src/guard/decoration-provider.ts](src/guard/decoration-provider.ts) — manages a single `TextEditorDecorationType` instance. Uses whole-line background/foreground coloring (defaults to `editorWarning.foreground` theme color, user-overridable via `streamGuard.decorationColor`) with a `before` pseudo-element showing "⚠️ Stream Guard Active".
- **Pattern matcher**: [src/guard/pattern-matcher.ts](src/guard/pattern-matcher.ts) — minimal glob-to-regex converter (no external deps). Normalizes backslashes and tests both full path and basename.
- **Language config**: [src/languages/language-config.ts](src/languages/language-config.ts) — built-in comment-syntax registry for 28 languages. Users can override via `streamGuard.languageCommentPrefixes`. Unknown languages fall back to `["//", "#", "--"]`.
- **Config**: [src/config/](src/config/) — `readConfig()` in `workspace-config.ts` reads from VS Code workspace settings and applies custom language prefixes; `watchConfig()` in `config-watcher.ts` listens for `onDidChangeConfiguration`.
- **Logger**: [src/utils/logger.ts](src/utils/logger.ts) — thin wrapper around a VS Code `OutputChannel` (`logInfo`, `logWarn`, `logError`).

## Data Flow

```
User toggles / edits doc / config changes
  → refreshEditor(editor)
    → getCachedConfig()       (cached workspace settings)
    → rangeCache lookup       (skip re-parse if cached)
    → matchesAnyPattern()     (glob check → mask entire file?)
    → parseGuardComments()    (scan lines for @stream-guard-* tokens)
    → applyDecorations()      (set TextEditorDecorationType ranges)
```

On document edit, the extension evicts the stale cache, clears existing decorations on **all** editors showing that document (including split views), re-parses via `preCacheDocument()`, then refreshes each editor.

## Development Commands

```bash
npm run compile      # TypeScript → out/  (CommonJS, ES2020)
npm run watch        # Compile in watch mode
npm test             # Mocha + ts-node — runs without VS Code host
npm run lint         # Biome check
npm run format       # Biome format --write
```

Tests in `src/test/` run directly with `mocha --require ts-node/register` — no VS Code test runner needed. Test only pure logic modules (comment-parser, pattern-matcher, language-config).

## Code Conventions

- **Formatter/linter**: Biome — 4-space indent, double quotes, semicolons, trailing commas, 120 char line width, `noExplicitAny: "error"`.
- **No `var`, always `const`** — enforced by Biome rules.
- **Types**: shared interfaces live in [src/types.ts](src/types.ts) (`StreamGuardConfig`, `MaskedRange`, `ParseResult`, `DecorationContext`, `LanguageCommentConfig`). Use `import type` for type-only imports.
- **Constants**: all magic strings (command IDs, config keys, comment tokens, output channel name) are centralized in [src/constants.ts](src/constants.ts).
- **VS Code API isolation**: only `extension.ts`, `guard-manager.ts`, `decoration-provider.ts`, `config/`, and `logger.ts` import `vscode`. Pure logic modules (`comment-parser.ts`, `pattern-matcher.ts`) stay VS Code-free for testability.
- **Disposal pattern**: anything creating VS Code resources must expose a `dispose*()` function called from `deactivate()`.

## Key Patterns

- **Adding a new comment token**: add to `COMMENT_TOKENS` in `constants.ts`, handle in `parseGuardComments()`, add test cases.
- **Supporting a new language**: add a `LanguageCommentConfig` entry to `BUILTIN_LANGUAGES` in `language-config.ts`.
- **New config setting**: add to `CONFIG_KEYS` in `constants.ts`, read in `workspace-config.ts`, declare in `package.json` under `contributes.configuration`.

## CI / Release

- CI runs on every push/PR to `main`: `npm ci → lint → compile → test`.
- Release triggers on `v*.*.*` tags: runs CI checks, then `vsce package` → GitHub Release + optional Marketplace publish (requires `VSCE_PAT` secret).
