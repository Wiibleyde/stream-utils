import * as vscode from "vscode";
import { logInfo } from "../utils/logger";

/**
 * Registers a listener that fires whenever workspace configuration changes.
 * Returns a Disposable that should be added to the extension's subscriptions.
 */
export function watchConfig(onChange: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("streamGuard")) {
            logInfo("Configuration changed — refreshing decorations.");
            onChange();
        }
    });
}
