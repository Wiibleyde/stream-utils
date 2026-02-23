import * as vscode from "vscode";
import { readConfig } from "../config/workspace-config";
import type { HiddenRange, StreamHiderConfig } from "../types";
import { logInfo, logWarn } from "../utils/logger";
import { parseHideComments } from "./comment-parser";
import { applyDecorations, clearDecorations } from "./decoration-provider";
import { matchesAnyPattern } from "./pattern-matcher";

/**
 * Cached hidden-range data per document URI, so we can apply decorations
 * instantly when an editor becomes visible instead of re-parsing.
 */
const rangeCache = new Map<string, HiddenRange[]>();

/** Cached config to avoid re-reading settings on every event. */
let configCache: StreamHiderConfig | undefined;
let configDirty = true;

/** Mark the cached config as stale (called on config change). */
export function invalidateConfigCache(): void {
    configDirty = true;
}

function getCachedConfig(): StreamHiderConfig {
    if (configDirty || !configCache) {
        configCache = readConfig();
        configDirty = false;
    }
    return configCache;
}

/**
 * Pre-parses a document and caches the hidden ranges so that when the
 * editor appears we can apply decorations without re-parsing.
 */
export function preCacheDocument(document: vscode.TextDocument): void {
    const config = getCachedConfig();
    if (!config.enabled) {
        return;
    }

    const filePath = document.uri.fsPath;
    const key = document.uri.toString();

    const fileIsHidden = matchesAnyPattern(filePath, config.hiddenFilePatterns);
    const folderIsHidden = matchesAnyPattern(filePath, config.hiddenFolders);

    if (fileIsHidden || folderIsHidden) {
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

    const { hiddenRanges } = parseHideComments(lines, document.languageId);
    if (hiddenRanges.length > 0) {
        rangeCache.set(key, hiddenRanges);
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
        applyDecorations({ editor, hiddenRanges: cached });
        return;
    }

    const fileIsHidden = matchesAnyPattern(filePath, config.hiddenFilePatterns);
    const folderIsHidden = matchesAnyPattern(filePath, config.hiddenFolders);

    if (fileIsHidden || folderIsHidden) {
        const lineCount = editor.document.lineCount;
        if (lineCount === 0) {
            clearDecorations(editor);
            return;
        }
        const hiddenRanges = [{ startLine: 0, endLine: lineCount - 1 }];
        rangeCache.set(cacheKey, hiddenRanges);
        applyDecorations({ editor, hiddenRanges });
        logInfo(`Hidden entire file: ${filePath}`);
        return;
    }

    const lines: string[] = [];
    for (let i = 0; i < editor.document.lineCount; i++) {
        lines.push(editor.document.lineAt(i).text);
    }

    const languageId = editor.document.languageId;
    const { hiddenRanges } = parseHideComments(lines, languageId);

    if (hiddenRanges.length === 0) {
        rangeCache.delete(cacheKey);
        clearDecorations(editor);
        return;
    }

    rangeCache.set(cacheKey, hiddenRanges);
    applyDecorations({ editor, hiddenRanges });
    logInfo(`Applied ${hiddenRanges.length} hidden range(s) to ${filePath}`);
}

/**
 * Toggles the `streamHider.enabled` setting in the user configuration.
 */
export async function toggleStreamMode(): Promise<void> {
    const config = getCachedConfig();
    const newValue = !config.enabled;

    try {
        await vscode.workspace
            .getConfiguration()
            .update("streamHider.enabled", newValue, vscode.ConfigurationTarget.Global);
        invalidateConfigCache();
        logInfo(`Stream mode ${newValue ? "enabled" : "disabled"}.`);
    } catch (err) {
        logWarn(`Could not update user config: ${err instanceof Error ? err.message : String(err)}`);
    }
}
