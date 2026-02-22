/**
 * Command identifiers registered by the StreamHider extension.
 */
export const COMMANDS = {
    TOGGLE: "streamHider.toggle",
} as const;

/**
 * Configuration keys used in .vscode/settings.json under the "streamHider" namespace.
 */
export const CONFIG_KEYS = {
    ENABLED: "streamHider.enabled",
    HIDDEN_FILE_PATTERNS: "streamHider.hiddenFilePatterns",
    HIDDEN_FOLDERS: "streamHider.hiddenFolders",
} as const;

/**
 * Comment tokens used to trigger inline hiding behaviour.
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
export const LANGUAGE_CONFIG_KEY = "streamHider.languageCommentPrefixes";

/**
 * Name of the VSCode OutputChannel used for extension logging.
 */
export const OUTPUT_CHANNEL_NAME = "StreamHider";
