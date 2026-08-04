import { describe, expect, it } from 'vitest';
import { pathToView, seoViews, type ToolView, viewSeo, viewToPath } from './tools';

const ALL_VIEWS: ToolView[] = ['formatted', 'tree', 'graph', 'stats', 'diff', 'search', 'map'];

describe('viewSeo catalog', () => {
  it('defines every ToolView exactly once', () => {
    expect(Object.keys(viewSeo).sort()).toEqual([...ALL_VIEWS].sort());
    expect(seoViews).toHaveLength(ALL_VIEWS.length);
  });

  it('gives each view a unique clean path', () => {
    const paths = seoViews.map((v) => v.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps path → view reverse lookup consistent with viewToPath', () => {
    for (const view of ALL_VIEWS) {
      const path = viewToPath(view);
      expect(pathToView[path]).toBe(view);
      expect(viewSeo[view].view).toBe(view);
      expect(viewSeo[view].path).toBe(path);
    }
  });

  it('uses / for the editor (formatted) home view', () => {
    expect(viewToPath('formatted')).toBe('/');
    expect(pathToView['/']).toBe('formatted');
  });

  it('provides SEO fields needed for crawlable pages', () => {
    for (const entry of seoViews) {
      expect(entry.heading.length).toBeGreaterThan(0);
      expect(entry.intro.length).toBeGreaterThan(0);
      expect(entry.faqs.length).toBeGreaterThan(0);
      expect(entry.features.length).toBeGreaterThan(0);
      expect(entry.howTo.length).toBeGreaterThan(0);
      expect(entry.metadata).toBeTruthy();
      // Absolute titles avoid the layout "%s | JSON Formatter" template.
      expect(entry.metadata.title).toMatchObject({ absolute: expect.any(String) });
      expect(entry.metadata.description).toEqual(expect.any(String));
    }
  });

  it('only links related items to known in-app paths or guides', () => {
    for (const entry of seoViews) {
      for (const related of entry.related) {
        expect(related.href.startsWith('/')).toBe(true);
        expect(related.title.length).toBeGreaterThan(0);
      }
    }
  });
});
