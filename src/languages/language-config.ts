import type { LanguageCommentConfig } from "../types";

/**
 * Built-in language definitions shipped with StreamGuard.
 * Each entry maps a VSCode language identifier to its comment syntax.
 */
const BUILTIN_LANGUAGES: LanguageCommentConfig[] = [
    // ── C-style ──────────────────────────────────────────────
    {
        id: "typescript",
        displayName: "TypeScript",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "javascript",
        displayName: "JavaScript",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "typescriptreact",
        displayName: "TypeScript (React)",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "javascriptreact",
        displayName: "JavaScript (React)",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "c",
        displayName: "C",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "cpp",
        displayName: "C++",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "csharp",
        displayName: "C#",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "java",
        displayName: "Java",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "go",
        displayName: "Go",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "rust",
        displayName: "Rust",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "swift",
        displayName: "Swift",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "kotlin",
        displayName: "Kotlin",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "php",
        displayName: "PHP",
        singleLine: ["//", "#"],
        block: { start: "/*", end: "*/" },
    },
    {
        id: "scss",
        displayName: "SCSS",
        singleLine: ["//"],
        block: { start: "/*", end: "*/" },
    },

    // ── Lua ──────────────────────────────────────────────────
    {
        id: "lua",
        displayName: "Lua",
        singleLine: ["--"],
        block: { start: "--[[", end: "]]" },
    },

    // ── SQL ──────────────────────────────────────────────────
    {
        id: "sql",
        displayName: "SQL",
        singleLine: ["--"],
        block: { start: "/*", end: "*/" },
    },

    // ── Hash-style ───────────────────────────────────────────
    {
        id: "python",
        displayName: "Python",
        singleLine: ["#"],
    },
    {
        id: "ruby",
        displayName: "Ruby",
        singleLine: ["#"],
    },
    {
        id: "shellscript",
        displayName: "Shell",
        singleLine: ["#"],
    },
    {
        id: "yaml",
        displayName: "YAML",
        singleLine: ["#"],
    },
    {
        id: "dockerfile",
        displayName: "Dockerfile",
        singleLine: ["#"],
    },
    {
        id: "perl",
        displayName: "Perl",
        singleLine: ["#"],
    },
    {
        id: "r",
        displayName: "R",
        singleLine: ["#"],
    },
    {
        id: "coffeescript",
        displayName: "CoffeeScript",
        singleLine: ["#"],
        block: { start: "###", end: "###" },
    },

    // ── Markup / CSS ─────────────────────────────────────────
    {
        id: "html",
        displayName: "HTML",
        singleLine: [],
        block: { start: "<!--", end: "-->" },
    },
    {
        id: "xml",
        displayName: "XML",
        singleLine: [],
        block: { start: "<!--", end: "-->" },
    },
    {
        id: "css",
        displayName: "CSS",
        singleLine: [],
        block: { start: "/*", end: "*/" },
    },

    // ── Other ────────────────────────────────────────────────
    {
        id: "powershell",
        displayName: "PowerShell",
        singleLine: ["#"],
        block: { start: "<#", end: "#>" },
    },
];

/** Internal map for fast lookup by language ID. */
const languageMap = new Map<string, LanguageCommentConfig>();

/** Populate the map from built-in defaults. */
for (const lang of BUILTIN_LANGUAGES) {
    languageMap.set(lang.id, lang);
}

/**
 * Returns the comment config for a given VSCode language identifier,
 * or `undefined` if the language is not registered.
 */
export function getLanguageConfig(languageId: string): LanguageCommentConfig | undefined {
    return languageMap.get(languageId);
}

/**
 * Returns a copy of all registered language configs.
 */
export function getAllLanguageConfigs(): LanguageCommentConfig[] {
    return [...languageMap.values()];
}

/**
 * Returns all registered language identifiers.
 */
export function getSupportedLanguageIds(): string[] {
    return [...languageMap.keys()];
}

/**
 * Registers or overrides a language config at runtime.
 * Used to apply user-defined `streamGuard.languageCommentPrefixes`.
 */
export function registerLanguageConfig(config: LanguageCommentConfig): void {
    languageMap.set(config.id, config);
}

/**
 * Merges user-supplied comment prefix overrides into the language map.
 *
 * The expected shape is a record mapping language IDs to single-line prefix arrays:
 * ```json
 * { "mylang": ["//", "#"] }
 * ```
 */
export function applyCustomPrefixes(custom: Record<string, string[]>): void {
    for (const [id, prefixes] of Object.entries(custom)) {
        const existing = languageMap.get(id);
        if (existing) {
            languageMap.set(id, { ...existing, singleLine: prefixes });
        } else {
            languageMap.set(id, {
                id,
                displayName: id,
                singleLine: prefixes,
            });
        }
    }
}

/**
 * Returns the single-line comment prefixes for the given language,
 * or a fallback list (`["//", "#", "--"]`) when the language is unknown
 * so that common comment styles are still recognised.
 */
export function getCommentPrefixes(languageId: string): string[] {
    const config = languageMap.get(languageId);
    if (config) {
        // Languages like HTML/CSS have no single-line prefix.
        // Return the block start as a loose fallback so inline tokens still work.
        if (config.singleLine.length === 0 && config.block) {
            return [config.block.start];
        }
        return config.singleLine;
    }
    // Unknown language → permissive fallback
    return ["//", "#", "--"];
}
