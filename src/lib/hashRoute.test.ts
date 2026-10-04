import { describe, expect, it } from 'vitest';
import { parseRoute } from './hashRoute.ts';

describe('parseRoute', () => {
  it('maps known hash paths', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/new')).toEqual({ name: 'new' });
    expect(parseRoute('/settings')).toEqual({ name: 'settings' });
    expect(parseRoute('/settings/variants')).toEqual({ name: 'variants' });
    expect(parseRoute('/folders')).toEqual({ name: 'folders' });
    expect(parseRoute('/deck/abc')).toEqual({ name: 'deck', id: 'abc' });
    expect(parseRoute('/unknown')).toEqual({ name: 'home' });
  });
});
