import type * as vscode from "vscode";

/**
 * Resolved configuration for the StreamGuard extension.
 */
export interface StreamGuardConfig {
    enabled: boolean;
    redactedFilePatterns: string[];
    redactedFolders: string[];
}

/**
 * Describes a range of lines in a document that should be redacted.
 */
export interface RedactedRange {
    startLine: number;
    /** Inclusive end line. */
    endLine: number;
}

/**
 * Result of parsing a single document for hide comments.
 */
export interface ParseResult {
    redactedRanges: RedactedRange[];
}

/**
 * Context passed to the decoration provider when applying decorations.
 */
export interface DecorationContext {
    editor: vscode.TextEditor;
    redactedRanges: RedactedRange[];
}

/**
 * Describes the comment syntax for a programming language.
 */
export interface LanguageCommentConfig {
    /** VSCode language identifier (e.g. "typescript", "lua"). */
    id: string;
    /** Human-readable display name (e.g. "TypeScript", "Lua"). */
    displayName: string;
    /** Single-line comment prefixes (e.g. ["//"] or ["--"]). */
    singleLine: string[];
    /** Optional block comment delimiters. */
    block?: { start: string; end: string };
}
