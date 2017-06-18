import { colour } from '../src/utils.js';

test('color generator', () => {
  expect(colour).toBeDefined();
  expect(colour(0)).toBe(2062260);
  expect(colour(1)).toBe(11454440);
});
