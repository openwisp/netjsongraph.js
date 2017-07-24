import {
  colour,
  promisify,
  isFn
} from '../src/utils.js';

test('color generator', () => {
  expect(colour).toBeDefined();
  expect(colour(0)).toBe(2062260);
  expect(colour(1)).toBe(11454440);
});

test('promisify', () => {
  function isPromise (obj) {
    return !!obj &&
      (typeof obj === 'object' || typeof obj === 'function') &&
      typeof obj.then === 'function';
  }
  const d = {
    f: () => {}
  };
  expect(promisify).toBeDefined();
  expect(promisify(d, d.f)).toBeTruthy();
});

test('is function', () => {
  const f = null;
  const fn = () => null;
  expect(isFn).toBeDefined();
  expect(isFn(f)).toBeFalsy();
  expect(isFn(fn)).toBeTruthy();
});
