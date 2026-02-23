import * as assert from "node:assert";
import { parseHideComments } from "../hide/comment-parser";

describe("comment-parser", () => {
    describe("@stream-hide-next", () => {
        it("hides the annotation and the line immediately following it", () => {
            const lines = ["// @stream-hide-next", "const value = 'example';", "const visible = true;"];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("does not hide lines beyond the next line", () => {
            const lines = ["// @stream-hide-next", "const value = 'example';", "const alsoVisible = true;"];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.strictEqual(redactedRanges[0].startLine, 0);
            assert.strictEqual(redactedRanges[0].endLine, 1);
        });

        it("handles annotation at the very last line (no following line)", () => {
            const lines = ["// @stream-hide-next"];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 0 });
        });
    });

    describe("@stream-hide-start / @stream-hide-end", () => {
        it("hides the entire block between start and end (inclusive)", () => {
            const lines = [
                "const a = 1;",
                "// @stream-hide-start",
                "const config = 'value';",
                "const setting = 'value';",
                "// @stream-hide-end",
                "const b = 2;",
            ];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 1, endLine: 4 });
        });

        it("supports multiple blocks in the same file", () => {
            const lines = [
                "// @stream-hide-start",
                "const a = 1;",
                "// @stream-hide-end",
                "const visible = true;",
                "// @stream-hide-start",
                "const b = 2;",
                "// @stream-hide-end",
            ];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 2);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 2 });
            assert.deepStrictEqual(redactedRanges[1], { startLine: 4, endLine: 6 });
        });

        it("ignores a start without a matching end", () => {
            const lines = ["// @stream-hide-start", "const orphan = true;"];
            const { redactedRanges } = parseHideComments(lines);
            // No end token → no completed range
            assert.strictEqual(redactedRanges.length, 0);
        });
    });

    describe("@stream-hide-inline", () => {
        it("hides only the line containing the inline annotation", () => {
            const lines = [
                "const visible = true;",
                "const redacted = 'value'; // @stream-hide-inline",
                "const alsoVisible = true;",
            ];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 1, endLine: 1 });
        });

        it("handles multiple inline annotations on separate lines", () => {
            const lines = [
                "const a = 1; // @stream-hide-inline",
                "const b = 2;",
                "const c = 3; // @stream-hide-inline",
            ];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 2);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 0 });
            assert.deepStrictEqual(redactedRanges[1], { startLine: 2, endLine: 2 });
        });
    });

    describe("empty and plain input", () => {
        it("returns no ranges for an empty file", () => {
            const { redactedRanges } = parseHideComments([]);
            assert.strictEqual(redactedRanges.length, 0);
        });

        it("returns no ranges when there are no annotations", () => {
            const lines = ["const a = 1;", "const b = 2;"];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 0);
        });
    });

    describe("language-aware parsing", () => {
        it("parses Lua-style comments with -- prefix", () => {
            const lines = ["-- @stream-hide-next", "local value = 'example'", "local visible = true"];
            const { redactedRanges } = parseHideComments(lines, "lua");
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses Python-style comments with # prefix", () => {
            const lines = ["# @stream-hide-next", "value = 'example'", "visible = True"];
            const { redactedRanges } = parseHideComments(lines, "python");
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses TypeScript-style comments with // prefix", () => {
            const lines = ["// @stream-hide-next", "const value = 'example';", "const visible = true;"];
            const { redactedRanges } = parseHideComments(lines, "typescript");
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses Lua-style block hide comments", () => {
            const lines = [
                "local a = 1",
                "-- @stream-hide-start",
                "local config = 'value'",
                "local setting = 'value'",
                "-- @stream-hide-end",
                "local b = 2",
            ];
            const { redactedRanges } = parseHideComments(lines, "lua");
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 1, endLine: 4 });
        });

        it("parses Lua-style inline hide comments", () => {
            const lines = [
                "local visible = true",
                "local redacted = 'value' -- @stream-hide-inline",
                "local alsoVisible = true",
            ];
            const { redactedRanges } = parseHideComments(lines, "lua");
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 1, endLine: 1 });
        });

        it("ignores tokens that are not in a comment for a known language", () => {
            // The token appears in a string, not a comment — should not match for typescript
            const lines = ['const msg = "do not @stream-hide-next this";', "const other = 'value';"];
            const { redactedRanges } = parseHideComments(lines, "typescript");
            assert.strictEqual(redactedRanges.length, 0);
        });

        it("still works without languageId (permissive mode)", () => {
            const lines = ["-- @stream-hide-next", "local value = 'example'"];
            const { redactedRanges } = parseHideComments(lines);
            assert.strictEqual(redactedRanges.length, 1);
            assert.deepStrictEqual(redactedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("uses fallback prefixes for unknown languages", () => {
            const lines = ["// @stream-hide-next", "some code"];
            const { redactedRanges } = parseHideComments(lines, "unknown-lang-xyz");
            assert.strictEqual(redactedRanges.length, 1);
        });
    });
});
