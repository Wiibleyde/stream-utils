import * as vscode from "vscode";
import { CONFIG_KEYS, LANGUAGE_CONFIG_KEY } from "../constants";
import { applyCustomPrefixes } from "../languages/language-config";
import type { StreamGuardConfig } from "../types";

/**
 * Reads the StreamGuard configuration from the current workspace settings.
 */
export function readConfig(): StreamGuardConfig {
    const cfg = vscode.workspace.getConfiguration();

    const enabled = cfg.get<boolean>(CONFIG_KEYS.ENABLED) ?? false;
    const maskedFilePatterns = cfg.get<string[]>(CONFIG_KEYS.MASKED_FILE_PATTERNS) ?? [];
    const maskedFolders = cfg.get<string[]>(CONFIG_KEYS.MASKED_FOLDERS) ?? [];

    // Apply user-defined language comment prefixes (if any)
    const customPrefixes = cfg.get<Record<string, string[]>>(LANGUAGE_CONFIG_KEY) ?? {};
    if (Object.keys(customPrefixes).length > 0) {
        applyCustomPrefixes(customPrefixes);
    }

    return { enabled, maskedFilePatterns, maskedFolders };
}
