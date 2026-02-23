# StreamGuard — VSCode Extension

Apply a **decorative overlay** to selected lines of code during live streams (Twitch, YouTube, etc.) without ever modifying the actual source files.

All masking is done via the VSCode `TextEditorDecorationType` API — purely visual and non-destructive.

---

## Installation

### Option 1 — Visual Studio Marketplace *(recommended)*

1. Open VS Code.
2. Press `Ctrl+P` (or `Cmd+P` on macOS) to open the Quick Open bar.
3. Type `ext install NathanBonnell.stream-guard` and press `Enter`.
4. Click **Install**.

Or open the Extensions view (`Ctrl+Shift+X`), search for **StreamGuard**, and click **Install**.

---

### Option 2 — Install from a `.vsix` file

Download the latest `.vsix` from the releases, then:

```bash
code --install-extension stream-guard-<version>.vsix
```

Or inside VS Code:

1. Open the Extensions view (`Ctrl+Shift+X`).
2. Click the **`···`** menu (top-right of the Extensions panel).
3. Choose **Install from VSIX…** and select the downloaded file.

---

### Option 3 — Build from source

```bash
# 1. Clone the repository
git clone <repository-url>
cd stream-utils

# 2. Install dependencies
npm install

# 3. Build
npm run compile

# 4. Package as .vsix  (requires @vscode/vsce)
npm install -g @vscode/vsce
vsce package --no-dependencies

# 5. Install the generated .vsix
code --install-extension stream-guard-*.vsix
```

---

## Features

- **File/folder masking** — glob-pattern-based full-file masking via workspace settings
- **Inline comment masking** — annotate individual lines or blocks with special comments
- **Status bar indicator** — always know whether stream mode is active
- **Toggle command** — quickly enable/disable with `StreamGuard: Toggle Stream Mode`
- **Real-time updates** — decorations refresh instantly on every document change or config change

---

## Comment Syntax

| Annotation | Effect |
|---|---|
| `// @stream-guard-next` | Masks the **next** line |
| `// @stream-guard-inline` | Masks the line that contains this annotation |
| `// @stream-guard-start` | Starts a masked block |
| `// @stream-guard-end` | Ends a masked block |

### Examples

```ts
// @stream-guard-next
const greeting = "Hello, world!";    // ← this line is masked

const config = loadSettings();       // @stream-guard-inline  ← this line is masked

// @stream-guard-start
const host = "localhost";
const port = 3000;
// @stream-guard-end
// ↑ everything between start/end is masked
```

---

## Configuration (`.vscode/settings.json`)

```json
{
  "streamGuard.enabled": true,
  "streamGuard.maskedFilePatterns": ["**/generated.*", "**/build/output.*"],
  "streamGuard.maskedFolders": ["**/draft/**"]
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `streamGuard.enabled` | `boolean` | `false` | Toggle the extension globally |
| `streamGuard.maskedFilePatterns` | `string[]` | `[]` | Glob patterns — files matching these have their entire content masked |
| `streamGuard.maskedFolders` | `string[]` | `[]` | Glob patterns — files inside matching folders are fully masked |
| `streamGuard.languageCommentPrefixes` | `object` | `{}` | Custom comment prefixes per language ID (e.g. `{ "lua": ["--"] }`) |

---

## Commands

| Command | Description |
|---|---|
| `StreamGuard: Toggle Stream Mode` | Enables or disables stream masking |

---

## Development

```bash
npm install
npm run compile      # TypeScript build
npm test             # Run unit tests (mocha, no VSCode needed)
npm run lint         # Biome linter
npm run format       # Biome formatter
```

---

## Project Structure

```
src/
├── extension.ts               # Entry point (activate / deactivate)
├── constants.ts               # Command ids, config keys, comment tokens
├── types.ts                   # Shared TypeScript types
├── guard/
│   ├── comment-parser.ts      # Parse @stream-guard-* comments
│   ├── decoration-provider.ts # Apply/clear VSCode decorations
│   ├── guard-manager.ts       # Main orchestrator
│   └── pattern-matcher.ts     # Glob pattern matching for files/folders
├── config/
│   ├── workspace-config.ts    # Read StreamGuard config from workspace
│   └── config-watcher.ts      # React to config changes
└── utils/
    └── logger.ts              # Internal logger using OutputChannel
```
