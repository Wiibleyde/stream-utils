import * as vscode from "vscode";
import { CONFIG_KEYS, LANGUAGE_CONFIG_KEY } from "../constants";
import { applyCustomPrefixes } from "../languages/language-config";
import type { StreamHiderConfig } from "../types";

/**
 * Reads the StreamHider configuration from the current workspace settings.
 */
export function readConfig(): StreamHiderConfig {
    const cfg = vscode.workspace.getConfiguration();

    const enabled = cfg.get<boolean>(CONFIG_KEYS.ENABLED) ?? false;
    const hiddenFilePatterns = cfg.get<string[]>(CONFIG_KEYS.HIDDEN_FILE_PATTERNS) ?? [];
    const hiddenFolders = cfg.get<string[]>(CONFIG_KEYS.HIDDEN_FOLDERS) ?? [];

    // Apply user-defined language comment prefixes (if any)
    const customPrefixes = cfg.get<Record<string, string[]>>(LANGUAGE_CONFIG_KEY) ?? {};
    if (Object.keys(customPrefixes).length > 0) {
        applyCustomPrefixes(customPrefixes);
    }

    return { enabled, hiddenFilePatterns, hiddenFolders };
}
