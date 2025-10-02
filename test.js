const { createDefaultSdk } = require('baseline-toolkit');

console.log('Testing baseline-toolkit@0.1.3...');

const sdk = createDefaultSdk();
console.log('SDK functions:', Object.getOwnPropertyNames(sdk));

// Test feature checking
const isSupported = sdk.isSupported('js.array.toSorted', 'widely');
console.log('toSorted widely supported:', isSupported);

// Test code scanning
async function testScan() {
  const code = `const arr = [3,1].toSorted();`;
  const result = await sdk.scanCode(code, { target: 'widely' });
  console.log('Scan found', result.issues.length, 'issues');
  if (result.issues.length > 0) {
    console.log('Issue:', result.issues[0]);
  }
}

testScan().then(() => {
  console.log('✅ SDK test completed successfully!');
}).catch(err => {
  console.error('❌ SDK test failed:', err.message);
});