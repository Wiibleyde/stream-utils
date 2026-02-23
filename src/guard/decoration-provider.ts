import * as vscode from "vscode";
import type { DecorationContext } from "../types";

/** Single decoration type used for all guarded ranges (overlay style). */
let maskedDecorationType: vscode.TextEditorDecorationType | undefined;

function getDecorationType(): vscode.TextEditorDecorationType {
    if (maskedDecorationType) {
        return maskedDecorationType;
    }

    maskedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editorWarning.foreground"),
        color: new vscode.ThemeColor("editor.background"),
        isWholeLine: true,
        overviewRulerColor: new vscode.ThemeColor("editorWarning.foreground"),
        overviewRulerLane: vscode.OverviewRulerLane.Full,
        before: {
            contentText: "\u00A0\u00A0\u26A0\uFE0F\u00A0Stream\u00A0Guard\u00A0Active\u00A0\u00A0",
            color: new vscode.ThemeColor("editor.background"),
            backgroundColor: new vscode.ThemeColor("editorWarning.foreground"),
            fontWeight: "bold",
            margin: "0 4px 0 0",
        },
    });

    return maskedDecorationType;
}

/**
 * Eagerly creates the decoration type so it is ready before any editor opens.
 * Call once during extension activation.
 */
export function initDecorations(): void {
    getDecorationType();
}

/**
 * Applies redaction decorations to the given editor for all masked ranges.
 */
export function applyDecorations(ctx: DecorationContext): void {
    const { editor, maskedRanges } = ctx;
    const decorationType = getDecorationType();

    const ranges = maskedRanges.map(({ startLine, endLine }) => {
        const start = editor.document.lineAt(startLine).range.start;
        const end = editor.document.lineAt(endLine).range.end;
        return new vscode.Range(start, end);
    });

    editor.setDecorations(decorationType, ranges);
}

/**
 * Clears all StreamGuard decorations from the given editor.
 */
export function clearDecorations(editor: vscode.TextEditor): void {
    if (maskedDecorationType) {
        editor.setDecorations(maskedDecorationType, []);
    }
}

/**
 * Disposes all cached decoration types (call on extension deactivation).
 */
export function disposeDecorations(): void {
    if (maskedDecorationType) {
        maskedDecorationType.dispose();
        maskedDecorationType = undefined;
    }
}
