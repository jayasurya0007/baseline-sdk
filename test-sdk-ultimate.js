import { createDefaultSdk } from './packages/baseline-sdk/dist/index.js';

const code = `const arr = [1,2]; const sorted = arr.toSorted(); const safe = obj?.prop; const hasKey = Object.hasOwn(obj, 'key');`;

console.log('🚀 Testing SDK with full web-features dataset...');
const sdk = await createDefaultSdk();
const result = await sdk.scanCode(code, { target: 'widely' });
console.log(`📊 Detected ${result.issues.length} baseline violations:`);
result.issues.forEach(issue => console.log(`  ✖ ${issue.message}`));
