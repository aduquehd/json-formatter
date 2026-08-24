import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStored, removeStored, writeStored } from './safeStorage';

/** Replaces window.localStorage with something that throws on property access. */
function withHostileStorage(make: () => Storage) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get localStorage() {
        return make();
      },
    },
  });
  return () => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete (globalThis as { window?: unknown }).window;
  };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('safeStorage', () => {
  it('returns null on the server, where there is no window', () => {
    expect(readStored('theme')).toBeNull();
    expect(writeStored('theme', 'dark')).toBe(false);
    expect(removeStored('theme')).toBe(false);
  });

  it('survives storage that throws on property access (blocked site data)', () => {
    const restore = withHostileStorage(() => {
      throw new Error('SecurityError: The operation is insecure.');
    });
    try {
      expect(() => readStored('theme')).not.toThrow();
      expect(readStored('theme')).toBeNull();
      expect(writeStored('theme', 'dark')).toBe(false);
      expect(removeStored('theme')).toBe(false);
    } finally {
      restore();
    }
  });

  it('survives QuotaExceededError on write (Safari private browsing)', () => {
    const store = new Map<string, string>();
    const restore = withHostileStorage(
      () =>
        ({
          getItem: (k: string) => store.get(k) ?? null,
          setItem: () => {
            throw new Error('QuotaExceededError');
          },
          removeItem: (k: string) => void store.delete(k),
        }) as unknown as Storage
    );
    try {
      store.set('theme', 'light');
      expect(readStored('theme')).toBe('light');
      expect(writeStored('theme', 'dark')).toBe(false);
      expect(readStored('theme')).toBe('light');
    } finally {
      restore();
    }
  });

  it('round-trips through working storage', () => {
    const store = new Map<string, string>();
    const restore = withHostileStorage(
      () =>
        ({
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => void store.set(k, v),
          removeItem: (k: string) => void store.delete(k),
        }) as unknown as Storage
    );
    try {
      expect(writeStored('theme', 'dark')).toBe(true);
      expect(readStored('theme')).toBe('dark');
      expect(removeStored('theme')).toBe(true);
      expect(readStored('theme')).toBeNull();
    } finally {
      restore();
    }
  });
});

describe('JSON-LD escaping', () => {
  // Mirrors the transform in src/components/seo/JsonLd.tsx. Kept here because the
  // component itself needs a DOM to render and vitest runs in a node environment.
  const encode = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

  it('neutralises a payload that would close the script element', () => {
    const encoded = encode({ name: '</script><img src=x onerror=alert(1)>' });
    expect(encoded).not.toContain('</script>');
    expect(encoded).not.toContain('<');
  });

  it('decodes back to the original value', () => {
    const data = { name: 'a < b </script>', nested: { x: '<!--' } };
    expect(JSON.parse(encode(data))).toEqual(data);
  });

  it('leaves ordinary schemas byte-identical', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'x' };
    expect(encode(schema)).toBe(JSON.stringify(schema));
  });
});
