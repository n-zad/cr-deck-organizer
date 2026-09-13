import { describe, expect, it } from 'vitest';
import { parseRoute } from './hashRoute.ts';

describe('parseRoute', () => {
  it('maps known hash paths', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/new')).toEqual({ name: 'new' });
    expect(parseRoute('/deck/abc')).toEqual({ name: 'deck', id: 'abc' });
    expect(parseRoute('/unknown')).toEqual({ name: 'home' });
  });
});
