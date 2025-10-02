import { createDefaultSdk } from './packages/baseline-sdk/dist/index.js';

console.log('🚀 Testing SDK with ultimate comprehensive feature detection...');

const jsCode = `
// Array methods
const sorted = arr.toSorted();
const reversed = arr.toReversed();
const spliced = arr.toSpliced(1, 1, 99);
const item = arr.at(-1);
const last = arr.findLast(x => x > 1);

// Modern syntax
const safe = obj?.prop;
const fallback = value ?? 'default';
obj.prop ??= 'value';

// Object methods
const hasKey = Object.hasOwn(obj, 'key');
const entries = Object.fromEntries([['a', 1]]);

// String methods
const text = str.replaceAll('old', 'new');
const matches = str.matchAll(/test/g);

// Promise methods
const settled = Promise.allSettled([p1, p2]);
const any = Promise.any([p1, p2]);

// Web APIs
const controller = new AbortController();
const big = 123n;
const module = import('./file.js');
`;

const cssCode = `
.container {
  display: grid;
  display: flex;
  display: contents;
  gap: 1rem;
  aspect-ratio: 16/9;
  accent-color: blue;
  backdrop-filter: blur(10px);
  container-type: inline-size;
  view-transition-name: slide;
  inline-size: 100%;
  color: oklch(0.7 0.15 180);
  background: color-mix(in srgb, red, blue);
}

.parent { & .child { color: red; } }
.selector:has(.child) { transform: scale(1.1); }
.item:where(.active, .focused) { outline: 2px solid blue; }
.element:is(.primary, .secondary) { font-weight: bold; }
`;

try {
  const sdk = await createDefaultSdk();
  console.log('✅ SDK created successfully with full web-features dataset');
  
  console.log('\n📊 Testing JavaScript features:');
  const jsResult = await sdk.scanCode(jsCode, { target: 'widely' });
  console.log(`Found ${jsResult.issues.length} JavaScript baseline violations:`);
  jsResult.issues.slice(0, 5).forEach(issue => 
    console.log(`  ✖ ${issue.message} (${issue.featureId})`)
  );
  if (jsResult.issues.length > 5) {
    console.log(`  ... and ${jsResult.issues.length - 5} more`);
  }
  
  console.log('\n🎨 Testing CSS features:');
  const cssResult = await sdk.scanCode(cssCode, { target: 'widely' });
  console.log(`Found ${cssResult.issues.length} CSS baseline violations:`);
  cssResult.issues.slice(0, 5).forEach(issue => 
    console.log(`  ✖ ${issue.message} (${issue.featureId})`)
  );
  if (cssResult.issues.length > 5) {
    console.log(`  ... and ${cssResult.issues.length - 5} more`);
  }
  
  console.log(`\n🎯 Total violations detected: ${jsResult.issues.length + cssResult.issues.length}`);
  console.log('✅ SDK test completed successfully!');
  
} catch (error) {
  console.error('❌ SDK test failed:', error.message);
}
