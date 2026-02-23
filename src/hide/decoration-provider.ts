import * as vscode from "vscode";
import type { DecorationContext } from "../types";

/** Single decoration type used for all hidden ranges (redaction bar style). */
let hiddenDecorationType: vscode.TextEditorDecorationType | undefined;

function getDecorationType(): vscode.TextEditorDecorationType {
    if (hiddenDecorationType) {
        return hiddenDecorationType;
    }

    hiddenDecorationType = vscode.window.createTextEditorDecorationType({
        color: new vscode.ThemeColor("editorWarning.foreground"),
        backgroundColor: new vscode.ThemeColor("editorWarning.foreground"),
        letterSpacing: "-0.5em",
        isWholeLine: true,
        overviewRulerColor: new vscode.ThemeColor("editorWarning.foreground"),
        overviewRulerLane: vscode.OverviewRulerLane.Full,
        before: {
            contentText: "\u00A0\u00A0🔒\u00A0Redacted\u00A0\u00A0",
            color: new vscode.ThemeColor("editor.background"),
            backgroundColor: new vscode.ThemeColor("editorWarning.foreground"),
            fontWeight: "bold",
            margin: "0 4px 0 0",
        },
        after: {
            contentText: "\u00A0",
            backgroundColor: new vscode.ThemeColor("editorWarning.foreground"),
        },
    });

    return hiddenDecorationType;
}

/**
 * Eagerly creates the decoration type so it is ready before any editor opens.
 * Call once during extension activation.
 */
export function initDecorations(): void {
    getDecorationType();
}

/**
 * Applies hiding decorations to the given editor for all hidden ranges.
 */
export function applyDecorations(ctx: DecorationContext): void {
    const { editor, hiddenRanges } = ctx;
    const decorationType = getDecorationType();

    const ranges = hiddenRanges.map(({ startLine, endLine }) => {
        const start = editor.document.lineAt(startLine).range.start;
        const end = editor.document.lineAt(endLine).range.end;
        return new vscode.Range(start, end);
    });

    editor.setDecorations(decorationType, ranges);
}

/**
 * Clears all StreamHider decorations from the given editor.
 */
export function clearDecorations(editor: vscode.TextEditor): void {
    if (hiddenDecorationType) {
        editor.setDecorations(hiddenDecorationType, []);
    }
}

/**
 * Disposes all cached decoration types (call on extension deactivation).
 */
export function disposeDecorations(): void {
    if (hiddenDecorationType) {
        hiddenDecorationType.dispose();
        hiddenDecorationType = undefined;
    }
}
