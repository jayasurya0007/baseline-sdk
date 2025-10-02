// Comprehensive JavaScript feature patterns
const JS_PATTERNS = [
    // Array methods
    { pattern: /\.toSorted\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toSorted' },
    { pattern: /\.toReversed\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toReversed' },
    { pattern: /\.toSpliced\b/g, featureId: 'array-by-copy', name: 'Array.prototype.toSpliced' },
    { pattern: /\.with\b/g, featureId: 'array-by-copy', name: 'Array.prototype.with' },
    { pattern: /\.at\b/g, featureId: 'array-at', name: 'Array.prototype.at' },
    { pattern: /\.findLast\b/g, featureId: 'array-findlast', name: 'Array.prototype.findLast' },
    { pattern: /\.findLastIndex\b/g, featureId: 'array-findlast', name: 'Array.prototype.findLastIndex' },
    // Promise methods
    { pattern: /Promise\.allSettled\b/g, featureId: 'promise-allsettled', name: 'Promise.allSettled' },
    { pattern: /Promise\.any\b/g, featureId: 'promise-any', name: 'Promise.any' },
    // Modern JavaScript syntax
    { pattern: /\?\./g, featureId: 'optional-chaining', name: 'Optional chaining (?.)' },
    { pattern: /\?\?(?!=)/g, featureId: 'nullish-coalescing', name: 'Nullish coalescing (??)' },
    { pattern: /\?\?=/g, featureId: 'logical-assignment', name: 'Nullish coalescing assignment (??=)' },
    { pattern: /\|\|=/g, featureId: 'logical-assignment', name: 'Logical OR assignment (||=)' },
    { pattern: /&&=/g, featureId: 'logical-assignment', name: 'Logical AND assignment (&&=)' },
    // Object methods
    { pattern: /Object\.hasOwn\b/g, featureId: 'object-hasown', name: 'Object.hasOwn' },
    { pattern: /Object\.fromEntries\b/g, featureId: 'object-fromentries', name: 'Object.fromEntries' },
    // String methods
    { pattern: /\.replaceAll\b/g, featureId: 'string-replaceall', name: 'String.prototype.replaceAll' },
    { pattern: /\.matchAll\b/g, featureId: 'string-matchall', name: 'String.prototype.matchAll' },
    { pattern: /\.trimStart\b/g, featureId: 'string-trim', name: 'String.prototype.trimStart' },
    { pattern: /\.trimEnd\b/g, featureId: 'string-trim', name: 'String.prototype.trimEnd' },
    // Web APIs
    { pattern: /new AbortController\b/g, featureId: 'abortcontroller', name: 'AbortController' },
    { pattern: /AbortSignal\.timeout\b/g, featureId: 'abortsignal-timeout', name: 'AbortSignal.timeout' },
    { pattern: /\.requestVideoFrameCallback\b/g, featureId: 'video-rvfc', name: 'requestVideoFrameCallback' },
    { pattern: /\.requestPictureInPicture\b/g, featureId: 'picture-in-picture', name: 'Picture-in-Picture API' },
    // Async/await patterns
    { pattern: /for\s+await\s*\(/g, featureId: 'async-iteration', name: 'Async iteration (for await)' },
    { pattern: /import\s*\(/g, featureId: 'dynamic-import', name: 'Dynamic import()' },
    // BigInt
    { pattern: /\bbigint\b/gi, featureId: 'bigint', name: 'BigInt' },
    { pattern: /\d+n\b/g, featureId: 'bigint', name: 'BigInt literals' },
];
// Comprehensive CSS feature patterns
const CSS_PATTERNS = [
    // Layout
    { pattern: /display:\s*grid\b/gi, featureId: 'grid', name: 'CSS Grid Layout' },
    { pattern: /display:\s*flex\b/gi, featureId: 'flexbox', name: 'CSS Flexbox' },
    { pattern: /display:\s*contents\b/gi, featureId: 'display-contents', name: 'display: contents' },
    { pattern: /gap:/gi, featureId: 'flexbox-gap', name: 'Gap property' },
    { pattern: /row-gap:/gi, featureId: 'flexbox-gap', name: 'Row gap' },
    { pattern: /column-gap:/gi, featureId: 'flexbox-gap', name: 'Column gap' },
    // Container queries
    { pattern: /@container\b/gi, featureId: 'container-queries', name: 'Container queries' },
    { pattern: /container-type:/gi, featureId: 'container-queries', name: 'container-type property' },
    { pattern: /container-name:/gi, featureId: 'container-queries', name: 'container-name property' },
    // Modern CSS properties
    { pattern: /aspect-ratio:/gi, featureId: 'aspect-ratio', name: 'aspect-ratio property' },
    { pattern: /accent-color:/gi, featureId: 'accent-color', name: 'accent-color property' },
    { pattern: /backdrop-filter:/gi, featureId: 'backdrop-filter', name: 'backdrop-filter property' },
    { pattern: /scroll-behavior:/gi, featureId: 'scroll-behavior', name: 'scroll-behavior property' },
    { pattern: /scroll-snap-type:/gi, featureId: 'scroll-snap', name: 'CSS Scroll Snap' },
    { pattern: /scroll-timeline:/gi, featureId: 'scroll-timeline', name: 'scroll-timeline property' },
    // Color functions
    { pattern: /color-mix\s*\(/gi, featureId: 'color-mix', name: 'color-mix() function' },
    { pattern: /oklch\s*\(/gi, featureId: 'oklch', name: 'oklch() color function' },
    { pattern: /oklab\s*\(/gi, featureId: 'oklab', name: 'oklab() color function' },
    { pattern: /lab\s*\(/gi, featureId: 'lab-colors', name: 'lab() color function' },
    { pattern: /lch\s*\(/gi, featureId: 'lab-colors', name: 'lch() color function' },
    // Selectors
    { pattern: /:has\s*\(/gi, featureId: 'css-has', name: ':has() pseudo-class' },
    { pattern: /:where\s*\(/gi, featureId: 'css-where', name: ':where() pseudo-class' },
    { pattern: /:is\s*\(/gi, featureId: 'css-is', name: ':is() pseudo-class' },
    // Logical properties
    { pattern: /inline-size:/gi, featureId: 'logical-properties', name: 'Logical properties (inline-size)' },
    { pattern: /block-size:/gi, featureId: 'logical-properties', name: 'Logical properties (block-size)' },
    { pattern: /margin-inline:/gi, featureId: 'logical-properties', name: 'Logical properties (margin-inline)' },
    { pattern: /margin-block:/gi, featureId: 'logical-properties', name: 'Logical properties (margin-block)' },
    // View Transitions
    { pattern: /view-transition-name:/gi, featureId: 'view-transitions', name: 'View Transitions API' },
    { pattern: /::view-transition/gi, featureId: 'view-transitions', name: 'View Transitions pseudo-elements' },
    // Nesting
    { pattern: /&\s*[.#\[:]/gi, featureId: 'css-nesting', name: 'CSS Nesting' },
];
export class FeatureDetector {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    detectFeatures(source, target) {
        const issues = [];
        const lines = source.split('\n');
        // Detect JavaScript features
        for (const { pattern, featureId, name } of JS_PATTERNS) {
            const matches = source.matchAll(pattern);
            for (const match of matches) {
                const feature = this.dataSource.getFeatureById(featureId);
                if (feature && !this.isSupported(feature.status.baseline, target)) {
                    const position = this.getLineAndColumn(source, match.index || 0);
                    issues.push({
                        featureId,
                        line: position.line,
                        column: position.column,
                        kind: 'js',
                        message: `${name} is below required Baseline (${target})`,
                        pattern: match[0]
                    });
                }
            }
        }
        // Detect CSS features
        for (const { pattern, featureId, name } of CSS_PATTERNS) {
            const matches = source.matchAll(pattern);
            for (const match of matches) {
                const feature = this.dataSource.getFeatureById(featureId);
                if (feature && !this.isSupported(feature.status.baseline, target)) {
                    const position = this.getLineAndColumn(source, match.index || 0);
                    issues.push({
                        featureId,
                        line: position.line,
                        column: position.column,
                        kind: 'css',
                        message: `${name} is below required Baseline (${target})`,
                        pattern: match[0]
                    });
                }
            }
        }
        return issues;
    }
    isSupported(featureBaseline, target) {
        const order = ['limited', 'newly', 'widely'];
        return order.indexOf(featureBaseline) >= order.indexOf(target);
    }
    getLineAndColumn(source, index) {
        const beforeMatch = source.substring(0, index);
        const lines = beforeMatch.split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }
}
//# sourceMappingURL=featureDetector.js.map