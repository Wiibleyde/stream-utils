/**
 * Converts a glob pattern (only `*` and `**` wildcards) into a RegExp.
 * This is intentionally minimal — full micromatch is not available in a
 * plain VSCode extension without bundling an extra dependency.
 */
function globToRegExp(pattern: string): RegExp {
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex special chars (not * and ?)
        .replace(/\*\*/g, "{{GLOBSTAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, "[^/]")
        .replace(/\{\{GLOBSTAR\}\}/g, ".*");

    return new RegExp(`^${escaped}$`);
}

/**
 * Returns true when `filePath` matches at least one of the provided glob patterns.
 * Paths are matched against the full path as well as the basename.
 */
export function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
    if (patterns.length === 0) {
        return false;
    }

    const normalised = filePath.replace(/\\/g, "/");
    const segments = normalised.split("/");
    const basename = segments[segments.length - 1] ?? "";

    return patterns.some((pattern) => {
        const re = globToRegExp(pattern);
        return re.test(normalised) || re.test(basename);
    });
}

/**
 * Returns true when `folderPath` is covered by any of the folder glob patterns.
 */
export function matchesFolderPattern(folderPath: string, folderPatterns: string[]): boolean {
    return matchesAnyPattern(folderPath, folderPatterns);
}
