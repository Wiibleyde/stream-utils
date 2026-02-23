# StreamHider — VSCode Extension

![CI](https://github.com/Wiibleyde/stream-utils/actions/workflows/ci.yml/badge.svg)

Visually **redact** parts of your code during live streams (Twitch, YouTube, etc.) without ever modifying the actual source files.

All redacting is done via the VSCode `TextEditorDecorationType` API — purely visual and non-destructive.

---

## Installation

### Option 1 — Visual Studio Marketplace *(recommended)*

1. Open VS Code.
2. Press `Ctrl+P` (or `Cmd+P` on macOS) to open the Quick Open bar.
3. Type `ext install NathanBonnell.stream-hider` and press `Enter`.
4. Click **Install**.

Or open the Extensions view (`Ctrl+Shift+X`), search for **StreamHider**, and click **Install**.

---

### Option 2 — Install from a `.vsix` file

Download the latest `.vsix` from the [GitHub Releases page](https://github.com/Wiibleyde/stream-utils/releases), then:

```bash
code --install-extension stream-hider-<version>.vsix
```

Or inside VS Code:

1. Open the Extensions view (`Ctrl+Shift+X`).
2. Click the **`···`** menu (top-right of the Extensions panel).
3. Choose **Install from VSIX…** and select the downloaded file.

---

### Option 3 — Build from source

```bash
# 1. Clone the repository
git clone https://github.com/Wiibleyde/stream-utils.git
cd stream-utils

# 2. Install dependencies
npm install

# 3. Build
npm run compile

# 4. Package as .vsix  (requires @vscode/vsce)
npm install -g @vscode/vsce
vsce package --no-dependencies

# 5. Install the generated .vsix
code --install-extension stream-hider-*.vsix
```

---

## Features

- **File/folder redacting** — glob-pattern-based full-file redacting via workspace settings
- **Inline comment redacting** — annotate individual lines or blocks with special comments
- **Status bar indicator** — always know whether stream mode is active
- **Toggle command** — quickly enable/disable with `StreamHider: Toggle Stream Mode`
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
  "streamHider.enabled": true,
  "streamHider.hiddenFilePatterns": ["**/.env", "**/config.local.*"],
  "streamHider.hiddenFolders": ["**/private/**"]
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `streamHider.enabled` | `boolean` | `false` | Toggle the extension globally |
| `streamHider.hiddenFilePatterns` | `string[]` | `[]` | Glob patterns — files matching these have their entire content redacted |
| `streamHider.hiddenFolders` | `string[]` | `[]` | Glob patterns — files inside matching folders are fully redacted |
| `streamHider.languageCommentPrefixes` | `object` | `{}` | Custom comment prefixes per language ID (e.g. `{ "lua": ["--"] }`) |

---

## Commands

| Command | Description |
|---|---|
| `StreamHider: Toggle Stream Mode` | Enables or disables stream redacting |

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
│   ├── workspace-config.ts    # Read streamHider config from workspace
│   └── config-watcher.ts      # React to config changes
└── utils/
    └── logger.ts              # Internal logger using OutputChannel
```

---

## CI/CD

The repository uses **GitHub Actions** for continuous integration and automated releases.

### Continuous Integration (`ci.yml`)

Triggered on every **push** and **pull request** targeting `main`.

| Step | Command |
|---|---|
| Install dependencies | `npm ci` |
| Lint | `npm run lint` |
| Compile | `npm run compile` |
| Unit tests | `npm test` |

### Release (`release.yml`)

Triggered automatically when a tag matching `v*.*.*` is pushed.

```bash
# Create and push a new version tag to trigger a release
git tag v1.0.0
git push origin v1.0.0
```

| Step | Description |
|---|---|
| Lint + Compile + Test | Same checks as CI |
| `vsce package` | Produces a `.vsix` file |
| Upload artifact | `.vsix` is attached to the GitHub Actions run |
| Publish to Marketplace | Runs when the `VSCE_PAT` secret is configured |
| GitHub Release | Creates a release with the `.vsix` attached and auto-generated notes |

#### Required secret

To enable automatic publishing to the Visual Studio Marketplace, add the following secret in **Settings → Secrets and variables → Actions**:

| Secret name | Value |
|---|---|
| `VSCE_PAT` | Your [Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token) from Azure DevOps |

> If `VSCE_PAT` is not set, the workflow still runs, packages the `.vsix`, and creates a GitHub Release — the Marketplace publish step is simply skipped.