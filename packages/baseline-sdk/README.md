# @baseline-toolkit/baseline-sdk

Core SDK for Baseline feature checks.

## Install

```bash
npm i @baseline-toolkit/baseline-sdk
```

In this monorepo the package is already linked.

## API

- createSdk(dataSource): BaselineSdk
- createDefaultSdk(): BaselineSdk (uses bundled sample data)
- BaselineSdk.isSupported(featureId, target)
- BaselineSdk.scanCode(source, { target })

`target` is one of: `limited`, `newly`, `widely`.

## Examples

```ts
import { createDefaultSdk } from '@baseline-toolkit/baseline-sdk';

const sdk = createDefaultSdk();
const ok = sdk.isSupported('js.array.toSorted', 'widely');
console.log('toSorted widely?', ok);

const source = `const x = [3,1].toSorted()`;
const result = await sdk.scanCode(source, { target: 'widely' });
console.log(result.issues);
```

## Data source

This SDK ships with a tiny `features.sample.json` for demo. You can also load the real dataset:

```ts
import { createWebFeaturesSdk } from '@baseline-toolkit/baseline-sdk';

const sdk = await createWebFeaturesSdk();
```


