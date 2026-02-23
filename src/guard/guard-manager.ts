import * as vscode from "vscode";
import { readConfig } from "../config/workspace-config";
import type { MaskedRange, StreamGuardConfig } from "../types";
import { logInfo, logWarn } from "../utils/logger";
import { parseGuardComments } from "./comment-parser";
import { applyDecorations, clearDecorations } from "./decoration-provider";
import { matchesAnyPattern } from "./pattern-matcher";

/**
 * Cached masked-range data per document URI, so we can apply decorations
 * instantly when an editor becomes visible instead of re-parsing.
 */
const rangeCache = new Map<string, MaskedRange[]>();

/** Cached config to avoid re-reading settings on every event. */
let configCache: StreamGuardConfig | undefined;
let configDirty = true;

/** Mark the cached config as stale (called on config change). */
export function invalidateConfigCache(): void {
    configDirty = true;
}

function getCachedConfig(): StreamGuardConfig {
    if (configDirty || !configCache) {
        configCache = readConfig();
        configDirty = false;
    }
    return configCache;
}

/**
 * Pre-parses a document and caches the masked ranges so that when the
 * editor appears we can apply decorations without re-parsing.
 */
export function preCacheDocument(document: vscode.TextDocument): void {
    const config = getCachedConfig();
    if (!config.enabled) {
        return;
    }

    const filePath = document.uri.fsPath;
    const key = document.uri.toString();

    const fileIsmasked = matchesAnyPattern(filePath, config.maskedFilePatterns);
    const folderIsmasked = matchesAnyPattern(filePath, config.maskedFolders);

    if (fileIsmasked || folderIsmasked) {
        const lineCount = document.lineCount;
        if (lineCount > 0) {
            rangeCache.set(key, [{ startLine: 0, endLine: lineCount - 1 }]);
        }
        return;
    }

    const lines: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        lines.push(document.lineAt(i).text);
    }

    const { maskedRanges } = parseGuardComments(lines, document.languageId);
    if (maskedRanges.length > 0) {
        rangeCache.set(key, maskedRanges);
    } else {
        rangeCache.delete(key);
    }
}

/**
 * Removes the cached ranges for a closed document.
 */
export function evictCacheForDocument(uri: vscode.Uri): void {
    rangeCache.delete(uri.toString());
}

/**
 * Refreshes decorations for all currently visible text editors.
 */
export function refreshAllEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
        refreshEditor(editor);
    }
}

/**
 * Refreshes decorations for a single text editor.
 * Uses the pre-parsed cache when available for faster application.
 */
export function refreshEditor(editor: vscode.TextEditor): void {
    const config = getCachedConfig();

    if (!config.enabled) {
        clearDecorations(editor);
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const cacheKey = editor.document.uri.toString();

    // Try the cache first for instant application
    const cached = rangeCache.get(cacheKey);
    if (cached && cached.length > 0) {
        applyDecorations({ editor, maskedRanges: cached });
        return;
    }

    const fileIsmasked = matchesAnyPattern(filePath, config.maskedFilePatterns);
    const folderIsmasked = matchesAnyPattern(filePath, config.maskedFolders);

    if (fileIsmasked || folderIsmasked) {
        const lineCount = editor.document.lineCount;
        if (lineCount === 0) {
            clearDecorations(editor);
            return;
        }
        const maskedRanges = [{ startLine: 0, endLine: lineCount - 1 }];
        rangeCache.set(cacheKey, maskedRanges);
        applyDecorations({ editor, maskedRanges });
        logInfo(`masked entire file: ${filePath}`);
        return;
    }

    const lines: string[] = [];
    for (let i = 0; i < editor.document.lineCount; i++) {
        lines.push(editor.document.lineAt(i).text);
    }

    const languageId = editor.document.languageId;
    const { maskedRanges } = parseGuardComments(lines, languageId);

    if (maskedRanges.length === 0) {
        rangeCache.delete(cacheKey);
        clearDecorations(editor);
        return;
    }

    rangeCache.set(cacheKey, maskedRanges);
    applyDecorations({ editor, maskedRanges });
    logInfo(`Applied ${maskedRanges.length} masked range(s) to ${filePath}`);
}

/**
 * Toggles the `streamGuard.enabled` setting in the user configuration.
 */
export async function toggleStreamMode(): Promise<void> {
    const config = getCachedConfig();
    const newValue = !config.enabled;

    try {
        await vscode.workspace
            .getConfiguration()
            .update("streamGuard.enabled", newValue, vscode.ConfigurationTarget.Workspace);
        invalidateConfigCache();
        logInfo(`Stream mode ${newValue ? "enabled" : "disabled"}.`);
    } catch (err) {
        logWarn(`Could not update user config: ${err instanceof Error ? err.message : String(err)}`);
    }
}
