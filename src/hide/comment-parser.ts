import { COMMENT_TOKENS } from "../constants";
import { getCommentPrefixes } from "../languages/language-config";
import type { RedactedRange, ParseResult } from "../types";

/**
 * Returns true when the line contains the given token inside a comment.
 *
 * When `commentPrefixes` are provided the function checks that the token
 * appears *after* one of the recognised comment prefixes, preventing
 * false positives in string literals or code. When the list is empty
 * or omitted the check falls back to a simple `includes()`.
 */
function isTokenInComment(line: string, token: string, commentPrefixes: string[]): boolean {
    if (!line.includes(token)) {
        return false;
    }

    if (commentPrefixes.length === 0) {
        return true;
    }

    const tokenIndex = line.indexOf(token);
    const before = line.slice(0, tokenIndex);

    return commentPrefixes.some((prefix) => before.includes(prefix));
}

/**
 * Parses the lines of a document and returns the ranges that should be redacted
 * based on `@stream-hide-*` comment annotations.
 *
 * Rules:
 *  - `// @stream-hide-next`   → redacts the annotation *and* the next line
 *  - `// @stream-hide-start` / `// @stream-hide-end` → redacts the block between them (inclusive)
 *  - `// @stream-hide-inline` at end of line → redacts that specific line
 *
 * An optional `languageId` (VSCode language identifier) can be supplied to
 * restrict token matching to lines that contain a recognised comment prefix
 * for that language.  When omitted the parser remains permissive and matches
 * any line that contains the token text.
 */
export function parseHideComments(lines: string[], languageId?: string): ParseResult {
    const redactedRanges: RedactedRange[] = [];
    let hideNextFrom: number | undefined;
    let blockStart: number | undefined;

    const prefixes = languageId ? getCommentPrefixes(languageId) : [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (isTokenInComment(line, COMMENT_TOKENS.HIDE_START, prefixes)) {
            blockStart = i;
            continue;
        }

        if (isTokenInComment(line, COMMENT_TOKENS.HIDE_END, prefixes)) {
            if (blockStart !== undefined) {
                redactedRanges.push({ startLine: blockStart, endLine: i });
                blockStart = undefined;
            }
            continue;
        }

        if (isTokenInComment(line, COMMENT_TOKENS.HIDE_NEXT, prefixes)) {
            hideNextFrom = i;
            continue;
        }

        if (isTokenInComment(line, COMMENT_TOKENS.HIDE_INLINE, prefixes)) {
            redactedRanges.push({ startLine: i, endLine: i });
            hideNextFrom = undefined;
            continue;
        }

        if (hideNextFrom !== undefined) {
            redactedRanges.push({ startLine: hideNextFrom, endLine: i });
            hideNextFrom = undefined;
        }
    }

    // If @stream-hide-next was the very last line, still redact the annotation itself
    if (hideNextFrom !== undefined) {
        redactedRanges.push({ startLine: hideNextFrom, endLine: hideNextFrom });
    }

    return { redactedRanges };
}
