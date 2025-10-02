// Ultimate test file with diverse modern web features
const arr = [1, 2, 3];
const sorted = arr.toSorted();
const reversed = arr.toReversed();
const spliced = arr.toSpliced(1, 1, 99);
const withItem = arr.with(0, 100);
const item = arr.at(-1);
const last = arr.findLast(x => x > 1);
const lastIndex = arr.findLastIndex(x => x > 1);

// Modern JavaScript syntax
const safe = obj?.prop?.nested;
const fallback = value ?? 'default';
obj.prop ??= 'assigned';
obj.flag ||= true;
obj.count &&= 5;

// Object and String methods
const hasKey = Object.hasOwn(obj, 'key');
const entries = Object.fromEntries([['a', 1]]);
const text = str.replaceAll('old', 'new');
const matches = str.matchAll(/pattern/g);

// Promise methods
const settled = Promise.allSettled([p1, p2, p3]);
const anyResult = Promise.any([p1, p2, p3]);

// Web APIs
const controller = new AbortController();
const signal = controller.signal;
const big = 123n;
const module = import('./dynamic.js');

// Modern features
const typedArray = new Int8Array([1, 2, 3]);
const sharedBuffer = new SharedArrayBuffer(1024);
const atomicValue = Atomics.load(new Int32Array(sharedBuffer), 0);
