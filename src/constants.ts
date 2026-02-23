/**
 * Command identifiers registered by the StreamGuard extension.
 */
export const COMMANDS = {
    TOGGLE: "streamGuard.toggle",
} as const;

/**
 * Configuration keys used in .vscode/settings.json under the "streamGuard" namespace.
 */
export const CONFIG_KEYS = {
    ENABLED: "streamGuard.enabled",
    REDACTED_FILE_PATTERNS: "streamGuard.redactedFilePatterns",
    REDACTED_FOLDERS: "streamGuard.redactedFolders",
} as const;

/**
 * Comment tokens used to trigger inline redaction behaviour.
 */
export const COMMENT_TOKENS = {
    HIDE_NEXT: "@stream-hide-next",
    HIDE_START: "@stream-hide-start",
    HIDE_END: "@stream-hide-end",
    HIDE_INLINE: "@stream-hide-inline",
} as const;

/**
 * Configuration key for user-defined language comment prefixes.
 */
export const LANGUAGE_CONFIG_KEY = "streamGuard.languageCommentPrefixes";

/**
 * Name of the VSCode OutputChannel used for extension logging.
 */
export const OUTPUT_CHANNEL_NAME = "StreamGuard";
