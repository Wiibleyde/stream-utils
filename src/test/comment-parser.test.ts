import * as assert from "node:assert";
import { parseGuardComments } from "../guard/comment-parser";

describe("comment-parser", () => {
    describe("@stream-guard-next", () => {
        it("hides the annotation and the line immediately following it", () => {
            const lines = ["// @stream-guard-next", "const value = 'example';", "const visible = true;"];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("does not hide lines beyond the next line", () => {
            const lines = ["// @stream-guard-next", "const value = 'example';", "const alsoVisible = true;"];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.strictEqual(maskedRanges[0].startLine, 0);
            assert.strictEqual(maskedRanges[0].endLine, 1);
        });

        it("handles annotation at the very last line (no following line)", () => {
            const lines = ["// @stream-guard-next"];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 0 });
        });
    });

    describe("@stream-guard-start / @stream-guard-end", () => {
        it("hides the entire block between start and end (inclusive)", () => {
            const lines = [
                "const a = 1;",
                "// @stream-guard-start",
                "const config = 'value';",
                "const setting = 'value';",
                "// @stream-guard-end",
                "const b = 2;",
            ];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 1, endLine: 4 });
        });

        it("supports multiple blocks in the same file", () => {
            const lines = [
                "// @stream-guard-start",
                "const a = 1;",
                "// @stream-guard-end",
                "const visible = true;",
                "// @stream-guard-start",
                "const b = 2;",
                "// @stream-guard-end",
            ];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 2);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 2 });
            assert.deepStrictEqual(maskedRanges[1], { startLine: 4, endLine: 6 });
        });

        it("ignores a start without a matching end", () => {
            const lines = ["// @stream-guard-start", "const orphan = true;"];
            const { maskedRanges } = parseGuardComments(lines);
            // No end token → no completed range
            assert.strictEqual(maskedRanges.length, 0);
        });
    });

    describe("@stream-guard-inline", () => {
        it("hides only the line containing the inline annotation", () => {
            const lines = [
                "const visible = true;",
                "const masked = 'value'; // @stream-guard-inline",
                "const alsoVisible = true;",
            ];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 1, endLine: 1 });
        });

        it("handles multiple inline annotations on separate lines", () => {
            const lines = [
                "const a = 1; // @stream-guard-inline",
                "const b = 2;",
                "const c = 3; // @stream-guard-inline",
            ];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 2);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 0 });
            assert.deepStrictEqual(maskedRanges[1], { startLine: 2, endLine: 2 });
        });
    });

    describe("empty and plain input", () => {
        it("returns no ranges for an empty file", () => {
            const { maskedRanges } = parseGuardComments([]);
            assert.strictEqual(maskedRanges.length, 0);
        });

        it("returns no ranges when there are no annotations", () => {
            const lines = ["const a = 1;", "const b = 2;"];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 0);
        });
    });

    describe("language-aware parsing", () => {
        it("parses Lua-style comments with -- prefix", () => {
            const lines = ["-- @stream-guard-next", "local value = 'example'", "local visible = true"];
            const { maskedRanges } = parseGuardComments(lines, "lua");
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses Python-style comments with # prefix", () => {
            const lines = ["# @stream-guard-next", "value = 'example'", "visible = True"];
            const { maskedRanges } = parseGuardComments(lines, "python");
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses TypeScript-style comments with // prefix", () => {
            const lines = ["// @stream-guard-next", "const value = 'example';", "const visible = true;"];
            const { maskedRanges } = parseGuardComments(lines, "typescript");
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("parses Lua-style block hide comments", () => {
            const lines = [
                "local a = 1",
                "-- @stream-guard-start",
                "local config = 'value'",
                "local setting = 'value'",
                "-- @stream-guard-end",
                "local b = 2",
            ];
            const { maskedRanges } = parseGuardComments(lines, "lua");
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 1, endLine: 4 });
        });

        it("parses Lua-style inline hide comments", () => {
            const lines = [
                "local visible = true",
                "local masked = 'value' -- @stream-guard-inline",
                "local alsoVisible = true",
            ];
            const { maskedRanges } = parseGuardComments(lines, "lua");
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 1, endLine: 1 });
        });

        it("ignores tokens that are not in a comment for a known language", () => {
            // The token appears in a string, not a comment — should not match for typescript
            const lines = ['const msg = "do not @stream-guard-next this";', "const other = 'value';"];
            const { maskedRanges } = parseGuardComments(lines, "typescript");
            assert.strictEqual(maskedRanges.length, 0);
        });

        it("still works without languageId (permissive mode)", () => {
            const lines = ["-- @stream-guard-next", "local value = 'example'"];
            const { maskedRanges } = parseGuardComments(lines);
            assert.strictEqual(maskedRanges.length, 1);
            assert.deepStrictEqual(maskedRanges[0], { startLine: 0, endLine: 1 });
        });

        it("uses fallback prefixes for unknown languages", () => {
            const lines = ["// @stream-guard-next", "some code"];
            const { maskedRanges } = parseGuardComments(lines, "unknown-lang-xyz");
            assert.strictEqual(maskedRanges.length, 1);
        });
    });
});
