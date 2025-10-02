const testCode = `
const arr = [1, 2, 3];
const sorted = arr.toSorted();
const item = arr.at(-1);
const safe = obj?.prop;
const fallback = value ?? 'default';
const hasKey = Object.hasOwn(obj, 'key');
const settled = Promise.allSettled([p1, p2]);
const big = 123n;
`;

console.log('🚀 Testing published baseline-toolkit@0.2.0 package...');

try {
  // Test ES modules import
  const { createDefaultSdk } = await import('baseline-toolkit');
  console.log('✅ Successfully imported createDefaultSdk from published package');
  
  const sdk = await createDefaultSdk();
  console.log('✅ SDK created successfully');
  
  const result = await sdk.scanCode(testCode, { target: 'widely' });
  console.log(`📊 Detected ${result.issues.length} baseline violations:`);
  result.issues.forEach(issue => console.log(`  ✖ ${issue.message}`));
  
  console.log('✅ NPM package test completed successfully!');
} catch (error) {
  console.error('❌ NPM package test failed:', error.message);
}
