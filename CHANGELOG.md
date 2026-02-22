# Changelog

All notable changes to the **StreamHider** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-02-22

### Added

- **Stream mode toggle** — `StreamHider: Toggle Stream Mode` command and status bar button.
- **Comment-based hiding** — `@stream-hide-next`, `@stream-hide-inline`, `@stream-hide-start` / `@stream-hide-end` annotations.
- **File/folder pattern hiding** — glob-based whole-file hiding via `streamHider.hiddenFilePatterns` and `streamHider.hiddenFolders`.
- **Custom language comment prefixes** — override comment syntax per language ID via `streamHider.languageCommentPrefixes`.
- **Built-in language support** — 20+ languages with pre-configured comment syntax.
- **Real-time updates** — decorations refresh instantly on every document change or config change.
- **TextMate injection grammar** — syntax-level hiding for zero-delay visual feedback.
