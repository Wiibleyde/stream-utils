# StreamGuard — VSCode Extension

Visually **redact** parts of your code during live streams (Twitch, YouTube, etc.) without ever modifying the actual source files.

All redacting is done via the VSCode `TextEditorDecorationType` API — purely visual and non-destructive.

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
git clone <your-repo-url>
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

- **File/folder redacting** — glob-pattern-based full-file redacting via workspace settings
- **Inline comment redacting** — annotate individual lines or blocks with special comments
- **Status bar indicator** — always know whether stream mode is active
- **Toggle command** — quickly enable/disable with `StreamGuard: Toggle Stream Mode`
- **Real-time updates** — decorations refresh instantly on every document change or config change

---

## Comment Syntax

| Annotation | Effect |
|---|---|
| `// @stream-hide-next` | Redacts the **next** line |
| `// @stream-hide-inline` | Redacts the line that contains this annotation |
| `// @stream-hide-start` | Starts a redacted block |
| `// @stream-hide-end` | Ends a redacted block |

### Examples

```ts
// @stream-hide-next
const greeting = "Hello, world!";    // ← this line is redacted

const config = loadSettings();       // @stream-hide-inline  ← this line is redacted

// @stream-hide-start
const host = "localhost";
const port = 3000;
// @stream-hide-end
// ↑ everything between start/end is redacted
```

---

## Configuration (`.vscode/settings.json`)

```json
{
  "StreamGuard.enabled": true,
  "StreamGuard.redactedFilePatterns": ["**/.env", "**/config.local.*"],
  "StreamGuard.redactedFolders": ["**/private/**"]
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `StreamGuard.enabled` | `boolean` | `false` | Toggle the extension globally |
| `StreamGuard.redactedFilePatterns` | `string[]` | `[]` | Glob patterns — files matching these have their entire content redacted |
| `StreamGuard.redactedFolders` | `string[]` | `[]` | Glob patterns — files inside matching folders are fully redacted |
| `StreamGuard.languageCommentPrefixes` | `object` | `{}` | Custom comment prefixes per language ID (e.g. `{ "lua": ["--"] }`) |

---

## Commands

| Command | Description |
|---|---|
| `StreamGuard: Toggle Stream Mode` | Enables or disables stream redacting |

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
├── hide/
│   ├── comment-parser.ts      # Parse @stream-hide-* comments
│   ├── decoration-provider.ts # Apply/clear VSCode decorations
│   ├── hide-manager.ts        # Main orchestrator
│   └── pattern-matcher.ts     # Glob pattern matching for files/folders
├── config/
│   ├── workspace-config.ts    # Read StreamGuard config from workspace
│   └── config-watcher.ts      # React to config changes
└── utils/
    └── logger.ts              # Internal logger using OutputChannel
```
