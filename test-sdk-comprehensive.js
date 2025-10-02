import { createDefaultSdk } from './packages/baseline-sdk/dist/index.js';

const jsCode = `
const arr = [1, 2, 3];
const sorted = arr.toSorted();
const reversed = arr.toReversed();
const item = arr.at(-1);
const last = arr.findLast(x => x > 1);
const safe = obj?.prop?.nested;
const fallback = value ?? 'default';
obj.prop ??= 'assigned';
const hasKey = Object.hasOwn(obj, 'key');
const text = str.replaceAll('old', 'new');
const settled = Promise.allSettled([p1, p2]);
const controller = new AbortController();
const big = 123n;
`;

const cssCode = `
.container {
  display: grid;
  gap: 1rem;
  aspect-ratio: 16/9;
  accent-color: blue;
  backdrop-filter: blur(10px);
  container-type: inline-size;
}
.parent { & .child { color: oklch(0.7 0.15 180); } }
.selector:has(.child) { inline-size: 100%; }
`;

console.log('🚀 Testing SDK with full web-features dataset...');
const sdk = await createDefaultSdk();

console.log('\n📊 JavaScript Features:');
const jsResult = await sdk.scanCode(jsCode, { target: 'widely' });
console.log(`Detected ${jsResult.issues.length} JavaScript baseline violations:`);
jsResult.issues.forEach(issue => console.log(`  ✖ ${issue.message}`));

console.log('\n🎨 CSS Features:');
const cssResult = await sdk.scanCode(cssCode, { target: 'widely' });
console.log(`Detected ${cssResult.issues.length} CSS baseline violations:`);
cssResult.issues.forEach(issue => console.log(`  ✖ ${issue.message}`));

console.log(`\n🎯 Total violations detected: ${jsResult.issues.length + cssResult.issues.length}`);
