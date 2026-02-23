import * as vscode from "vscode";
import { watchConfig } from "./config/config-watcher";
import { readConfig } from "./config/workspace-config";
import { COMMANDS } from "./constants";
import { clearDecorations, disposeDecorations, initDecorations } from "./guard/decoration-provider";
import {
    evictCacheForDocument,
    invalidateConfigCache,
    preCacheDocument,
    refreshAllEditors,
    refreshEditor,
    toggleStreamMode,
} from "./guard/guard-manager";
import { disposeLogger, logInfo } from "./utils/logger";

let statusBarItem: vscode.StatusBarItem | undefined;

function updateStatusBar(): void {
    if (!statusBarItem) {
        return;
    }

    const { enabled } = readConfig();
    statusBarItem.text = enabled ? "$(eye-closed) Stream Mode ON" : "$(eye) Stream Mode OFF";
    statusBarItem.tooltip = "Click to toggle StreamGuard";
    statusBarItem.backgroundColor = enabled ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined;
}

export function activate(context: vscode.ExtensionContext): void {
    logInfo("StreamGuard activating.");

    // Eagerly create the decoration type so it's ready before any editor opens
    initDecorations();

    // Pre-parse all currently open documents so the cache is warm
    for (const doc of vscode.workspace.textDocuments) {
        preCacheDocument(doc);
    }

    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = COMMANDS.TOGGLE;
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Toggle command
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.TOGGLE, async () => {
            await toggleStreamMode();
            updateStatusBar();
            refreshAllEditors();
        }),
    );

    // React to config changes
    context.subscriptions.push(
        watchConfig(() => {
            invalidateConfigCache();
            updateStatusBar();
            refreshAllEditors();
        }),
    );

    // Pre-parse documents as soon as they are opened (before they appear in an editor)
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            preCacheDocument(document);
        }),
    );

    // Evict cache when documents are closed
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => {
            evictCacheForDocument(document.uri);
        }),
    );

    // React to active editor changes — fires earlier than onDidChangeVisibleTextEditors
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                refreshEditor(editor);
            }
        }),
    );

    // React to document changes (real-time) — invalidate cache and re-apply
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            // Evict stale cache first so refreshEditor never reads old ranges
            evictCacheForDocument(event.document.uri);

            // Collect ALL editors showing this document (handles split views)
            const editors = vscode.window.visibleTextEditors.filter((e) => e.document === event.document);

            // Clear old decorations on every editor BEFORE re-parsing.
            // This prevents VS Code's internal Range-tracking from keeping
            // shifted decorations visible after guard comments are removed.
            for (const editor of editors) {
                clearDecorations(editor);
            }

            // Re-parse the updated document and refresh each editor
            preCacheDocument(event.document);
            for (const editor of editors) {
                refreshEditor(editor);
            }
        }),
    );

    // React to newly visible editors (fallback for split views etc.)
    context.subscriptions.push(
        vscode.window.onDidChangeVisibleTextEditors((editors) => {
            for (const editor of editors) {
                refreshEditor(editor);
            }
        }),
    );

    // Initial decoration pass
    refreshAllEditors();

    logInfo("StreamGuard activated.");
}

export function deactivate(): void {
    disposeDecorations();
    disposeLogger();
}
