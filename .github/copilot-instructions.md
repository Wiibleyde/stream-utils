# Copilot Instructions — StreamGuard

## Project Overview

StreamGuard is a **VS Code extension** that visually hides sensitive code during live streams using the `TextEditorDecorationType` API. It never modifies source files — all hiding is purely decorative.

## Architecture

The extension follows a layered architecture rooted in `src/`:

- **Entry point**: [src/extension.ts](src/extension.ts) — `activate()` wires up the status bar, commands, config watchers, and document-change listeners; `deactivate()` disposes resources.
- **Orchestrator**: [src/hide/hide-manager.ts](src/hide/hide-manager.ts) — `refreshEditor()` is the core pipeline: read config → check file/folder glob patterns → parse comment annotations → apply decorations. All visible editors are refreshed on config change, document edit, or editor visibility change.
- **Comment parser**: [src/hide/comment-parser.ts](src/hide/comment-parser.ts) — stateless function `parseHideComments(lines, languageId?)` returns `RedactedRange[]`. Supports `@stream-hide-next`, `@stream-hide-inline`, `@stream-hide-start`/`@stream-hide-end`.
- **Decoration provider**: [src/hide/decoration-provider.ts](src/hide/decoration-provider.ts) — manages `TextEditorDecorationType` instances keyed by replacement text. Uses `letterSpacing: "-1000em"` + transparent color to visually collapse text, with a `before` pseudo-element showing the placeholder.
- **Pattern matcher**: [src/hide/pattern-matcher.ts](src/hide/pattern-matcher.ts) — minimal glob-to-regex converter (no external deps). Normalizes backslashes and tests both full path and basename.
- **Language config**: [src/languages/language-config.ts](src/languages/language-config.ts) — built-in comment-syntax registry for 20+ languages. Users can override via `StreamGuard.languageCommentPrefixes`. Unknown languages fall back to `["//", "#", "--"]`.
- **Config**: [src/config/](src/config/) — `readConfig()` reads from VS Code workspace settings; `watchConfig()` listens for `onDidChangeConfiguration`.

## Data Flow

```
User toggles / edits doc / config changes
  → refreshEditor(editor)
    → readConfig()            (workspace settings)
    → matchesAnyPattern()     (glob check → hide entire file?)
    → parseHideComments()     (scan lines for @stream-hide-* tokens)
    → applyDecorations()      (set TextEditorDecorationType ranges)
```

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
- **Types**: shared interfaces live in [src/types.ts](src/types.ts). Use `import type` for type-only imports.
- **Constants**: all magic strings (command IDs, config keys, comment tokens, output channel name) are centralized in [src/constants.ts](src/constants.ts).
- **VS Code API isolation**: only `extension.ts`, `hide-manager.ts`, `decoration-provider.ts`, `config/`, and `logger.ts` import `vscode`. Pure logic modules (`comment-parser.ts`, `pattern-matcher.ts`) stay VS Code-free for testability.
- **Disposal pattern**: anything creating VS Code resources must expose a `dispose*()` function called from `deactivate()`.

## Key Patterns

- **Adding a new comment token**: add to `COMMENT_TOKENS` in `constants.ts`, handle in `parseHideComments()`, add test cases.
- **Supporting a new language**: add a `LanguageCommentConfig` entry to `BUILTIN_LANGUAGES` in `language-config.ts`.
- **New config setting**: add to `CONFIG_KEYS` in `constants.ts`, read in `workspace-config.ts`, declare in `package.json` under `contributes.configuration`.

## CI / Release

- CI runs on every push/PR to `main`: `npm ci → lint → compile → test`.
- Release triggers on `v*.*.*` tags: runs CI checks, then `vsce package` → GitHub Release + optional Marketplace publish (requires `VSCE_PAT` secret).
