import * as vscode from "vscode";
import { logInfo, logWarn } from "../utils/logger";

/**
 * Identifier prefix used to recognise our textMateRules among user-defined ones.
 */
const RULE_NAME = "StreamHider:hidden";

/**
 * The scope assigned by our injection grammar to hidden regions.
 */
const HIDDEN_SCOPE = "meta.stream-hidden.content.stream-hider";

/**
 * Fully-transparent foreground so the text is invisible from the very first
 * render (TextMate tokenisation runs synchronously before painting).
 */
const TRANSPARENT = "#00000000";

const SECTION = "editor.tokenColorCustomizations";

interface TextMateRule {
    name?: string;
    scope: string | string[];
    settings: Record<string, string>;
}

/**
 * Reads the current `editor.tokenColorCustomizations` value while
 * preserving any user-defined rules that are not ours.
 */
function getExistingRules(): TextMateRule[] {
    const cfg = vscode.workspace.getConfiguration();
    const customizations = cfg.get<Record<string, unknown>>(SECTION) ?? {};
    const rules = (customizations as Record<string, unknown>).textMateRules;
    if (Array.isArray(rules)) {
        return rules as TextMateRule[];
    }
    return [];
}

/**
 * Filters out any textMateRule that was inserted by StreamHider.
 */
function stripOurRules(rules: TextMateRule[]): TextMateRule[] {
    return rules.filter((r) => r.name !== RULE_NAME);
}

/**
 * Writes the merged textMateRules back to global settings, preserving
 * any other keys the user might have under `editor.tokenColorCustomizations`.
 */
async function writeRules(rules: TextMateRule[]): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    const existing = cfg.get<Record<string, unknown>>(SECTION) ?? {};

    const updated: Record<string, unknown> = { ...existing };
    if (rules.length > 0) {
        updated.textMateRules = rules;
    } else {
        updated.textMateRules = undefined;
    }

    // Write as the *last* key so our rule wins on equal specificity.
    const hasOtherKeys = Object.keys(updated).length > 0;
    await cfg.update(SECTION, hasOtherKeys ? updated : undefined, vscode.ConfigurationTarget.Global);
}

/**
 * Adds our transparent-foreground `textMateRule` so that any token scoped
 * `meta.stream-hidden.content.stream-hider` becomes invisible immediately
 * during TextMate tokenisation (no decoration delay / flash).
 */
export async function enableTokenHiding(): Promise<void> {
    const existing = getExistingRules();
    const cleaned = stripOurRules(existing);

    cleaned.push({
        name: RULE_NAME,
        scope: HIDDEN_SCOPE,
        settings: { foreground: TRANSPARENT },
    });

    try {
        await writeRules(cleaned);
        logInfo("Token-level hiding enabled (textMateRules updated).");
    } catch (err) {
        logWarn(`Could not update tokenColorCustomizations: ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * Removes our `textMateRule`, restoring normal text visibility.
 */
export async function disableTokenHiding(): Promise<void> {
    const existing = getExistingRules();
    const cleaned = stripOurRules(existing);

    try {
        await writeRules(cleaned);
        logInfo("Token-level hiding disabled (textMateRules cleaned).");
    } catch (err) {
        logWarn(`Could not update tokenColorCustomizations: ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * Returns `true` when our transparent textMateRule is currently active.
 */
export function isTokenHidingEnabled(): boolean {
    return getExistingRules().some((r) => r.name === RULE_NAME);
}
