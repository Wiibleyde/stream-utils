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
    MASKED_FILE_PATTERNS: "streamGuard.maskedFilePatterns",
    MASKED_FOLDERS: "streamGuard.maskedFolders",
} as const;

/**
 * Comment tokens used to trigger inline redaction behaviour.
 */
export const COMMENT_TOKENS = {
    GUARD_NEXT: "@stream-guard-next",
    GUARD_START: "@stream-guard-start",
    GUARD_END: "@stream-guard-end",
    GUARD_INLINE: "@stream-guard-inline",
} as const;

/**
 * Configuration key for user-defined language comment prefixes.
 */
export const LANGUAGE_CONFIG_KEY = "streamGuard.languageCommentPrefixes";

/**
 * Name of the VSCode OutputChannel used for extension logging.
 */
export const OUTPUT_CHANNEL_NAME = "StreamGuard";
