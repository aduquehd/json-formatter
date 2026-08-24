import { describe, expect, it } from 'vitest';

import {
  computeBounds,
  extractGeoData,
  geometryPositions,
  isDegenerateBounds,
  isValidLatitude,
  isValidLongitude,
  MAP_STYLES,
  MAX_MARKERS,
  pickDisplayName,
  pointFromCoordinates,
  serializeTileConsent,
  shapesSignature,
  TILE_CONSENT_KEY,
  TILE_HOSTS,
  TILE_PROVIDERS,
  tileConsentCovers,
  toCoordinateNumber,
  toDisplayString,
  toFeatureCollection,
  toLatLng,
  viewFromBounds,
} from './geoDetect';
import { MAX_JSON_DEPTH, nestDeeply, runDepthGuarded } from './jsonWalk';

describe('toDisplayString', () => {
  it('returns an empty string for null and undefined instead of "null"', () => {
    expect(toDisplayString(null)).toBe('');
    expect(toDisplayString(undefined)).toBe('');
  });

  it('passes strings through and stringifies scalars', () => {
    expect(toDisplayString('Paris')).toBe('Paris');
    expect(toDisplayString(0)).toBe('0');
    expect(toDisplayString(false)).toBe('false');
  });

  it('serializes objects and arrays so React never receives them raw', () => {
    expect(toDisplayString({ first: 'Ada' })).toBe('{"first":"Ada"}');
    expect(toDisplayString(['a', 'b'])).toBe('["a","b"]');
  });

  it('survives a circular value', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(typeof toDisplayString(circular)).toBe('string');
  });
});

describe('toCoordinateNumber', () => {
  it('accepts finite numbers including zero and negatives', () => {
    expect(toCoordinateNumber(0)).toBe(0);
    expect(toCoordinateNumber(-73.9)).toBe(-73.9);
  });

  it('accepts numeric strings', () => {
    expect(toCoordinateNumber('0')).toBe(0);
    expect(toCoordinateNumber(' 10.5 ')).toBe(10.5);
  });

  it('rejects "12abc" where parseFloat would have returned 12', () => {
    expect(toCoordinateNumber('12abc')).toBeNull();
  });

  it('rejects null, booleans, empty strings and non-scalars', () => {
    expect(toCoordinateNumber(null)).toBeNull();
    expect(toCoordinateNumber(undefined)).toBeNull();
    expect(toCoordinateNumber(true)).toBeNull();
    expect(toCoordinateNumber('')).toBeNull();
    expect(toCoordinateNumber('   ')).toBeNull();
    expect(toCoordinateNumber([5])).toBeNull();
    expect(toCoordinateNumber({ value: 5 })).toBeNull();
    expect(toCoordinateNumber(Number.NaN)).toBeNull();
    expect(toCoordinateNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('latitude and longitude ranges', () => {
  it('accepts the extremes and rejects everything past them', () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLatitude(500)).toBe(false);

    expect(isValidLongitude(0)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(181)).toBe(false);
  });

  it('rejects a pair when either half is out of range', () => {
    expect(toLatLng(91, 10)).toBeNull();
    expect(toLatLng(10, 181)).toBeNull();
    expect(toLatLng(0, 0)).toEqual({ lat: 0, lng: 0 });
  });
});

describe('pointFromCoordinates', () => {
  it('reads GeoJSON [longitude, latitude] order', () => {
    expect(pointFromCoordinates([-73.98, 40.75])).toEqual({ lat: 40.75, lng: -73.98 });
  });

  it('keeps a position whose values are zero', () => {
    expect(pointFromCoordinates([0, 0])).toEqual({ lat: 0, lng: 0 });
  });

  it('ignores an elevation third member', () => {
    expect(pointFromCoordinates([10, 20, 300])).toEqual({ lat: 20, lng: 10 });
  });

  it('rejects a polygon ring instead of coercing it to a bogus point', () => {
    expect(
      pointFromCoordinates([
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ])
    ).toBeNull();
    expect(
      pointFromCoordinates([
        [1, 2],
        [3, 4],
      ])
    ).toBeNull();
  });

  it('rejects short, non-array and out-of-range positions', () => {
    expect(pointFromCoordinates([10])).toBeNull();
    expect(pointFromCoordinates('10,20')).toBeNull();
    expect(pointFromCoordinates([200, 10])).toBeNull();
  });
});

describe('pickDisplayName', () => {
  it('prefers name, then city, title, label, place', () => {
    expect(pickDisplayName({ city: 'Lima', title: 'ignored' }, 'root')).toBe('Lima');
    expect(pickDisplayName({ label: 'Depot' }, 'root')).toBe('Depot');
  });

  it('coerces a nested object name to a string rather than returning it raw', () => {
    expect(pickDisplayName({ name: { first: 'Ada' } }, 'root')).toBe('{"first":"Ada"}');
  });

  it('skips empty and missing values and falls back', () => {
    expect(pickDisplayName({ name: '', city: 'Oslo' }, 'root')).toBe('Oslo');
    expect(pickDisplayName({ name: null }, 'items[0]')).toBe('items[0]');
    expect(pickDisplayName(null, 'root')).toBe('root');
  });
});

describe('extractGeoData — plain JSON', () => {
  it('keeps {lat: 0, lng: 10} — the equator is not "missing data"', () => {
    const result = extractGeoData({ lat: 0, lng: 10 });
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ lat: 0, lng: 10 });
  });

  it('keeps {lat: 0, lng: 0}', () => {
    expect(extractGeoData({ lat: 0, lng: 0 }).locations).toHaveLength(1);
  });

  it('drops out-of-range coordinates', () => {
    expect(extractGeoData({ lat: 91, lng: 10 }).locations).toHaveLength(0);
    expect(extractGeoData({ lat: 10, lng: 181 }).locations).toHaveLength(0);
    expect(extractGeoData({ lat: 500, lng: 500 }).locations).toHaveLength(0);
  });

  it('drops null coordinates instead of plotting Null Island', () => {
    expect(extractGeoData({ lat: null, lng: null }).locations).toHaveLength(0);
  });

  it('drops "12abc" coordinates', () => {
    expect(extractGeoData({ lat: '12abc', lng: '10' }).locations).toHaveLength(0);
  });

  it('accepts numeric strings', () => {
    const result = extractGeoData({ lat: '0', lng: '10' });
    expect(result.locations[0]).toMatchObject({ lat: 0, lng: 10 });
  });

  it('reads latitude/longitude and lat/lon spellings', () => {
    expect(extractGeoData({ latitude: 48.85, longitude: 2.35 }).locations[0]).toMatchObject({
      lat: 48.85,
      lng: 2.35,
    });
    expect(extractGeoData({ lat: 48.85, lon: 2.35 }).locations[0]).toMatchObject({
      lat: 48.85,
      lng: 2.35,
    });
  });

  it('reads a coordinates array as [lng, lat]', () => {
    const result = extractGeoData({ id: 1, coordinates: [2.35, 48.85] });
    expect(result.locations[0]).toMatchObject({ lat: 48.85, lng: 2.35 });
  });

  it('does not treat a polygon coordinates array as a point', () => {
    const result = extractGeoData({
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    });
    expect(result.locations).toHaveLength(0);
  });

  it('plots a nested location object exactly once', () => {
    const result = extractGeoData({ name: 'Office', location: { lat: 1, lng: 2 } });
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ lat: 1, lng: 2, name: 'Office' });
  });

  it('finds locations inside arrays and records their path', () => {
    const result = extractGeoData({
      cities: [
        { name: 'Oslo', lat: 59.91, lng: 10.75 },
        { name: 'Lima', lat: -12.04, lng: -77.04 },
      ],
    });
    expect(result.locations.map((location) => location.name)).toEqual(['Oslo', 'Lima']);
    expect(result.locations[0].path).toBe('cities[0]');
  });

  it('coerces an object name into a string so it can be rendered', () => {
    const result = extractGeoData({ name: { first: 'Ada' }, lat: 1, lng: 2 });
    expect(result.locations[0].name).toBe('{"first":"Ada"}');
  });

  it('returns nothing for a document with no geo data', () => {
    const result = extractGeoData({ users: [{ id: 1, name: 'Ada' }], total: 1 });
    expect(result.locations).toEqual([]);
    expect(result.shapes).toEqual([]);
    expect(result.bounds).toBeNull();
    expect(result.isGeoJSON).toBe(false);
  });

  it('handles non-object input without throwing', () => {
    expect(extractGeoData(null).locations).toEqual([]);
    expect(extractGeoData('hello').locations).toEqual([]);
    expect(extractGeoData(42).locations).toEqual([]);
  });

  it('caps the marker count but reports the true total', () => {
    const many = Array.from({ length: 25 }, (_, index) => ({ lat: index % 90, lng: index % 180 }));
    const result = extractGeoData(many, 10);
    expect(result.locations).toHaveLength(10);
    expect(result.totalLocations).toBe(25);
    expect(MAX_MARKERS).toBeGreaterThan(0);
  });
});

describe('extractGeoData — GeoJSON', () => {
  it('reads Point features in [lng, lat] order with their properties', () => {
    const result = extractGeoData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-73.98, 40.75] },
          properties: { name: 'New York', country: 'US' },
        },
      ],
    });
    expect(result.isGeoJSON).toBe(true);
    expect(result.locations[0]).toMatchObject({ lat: 40.75, lng: -73.98, name: 'New York' });
    expect(result.locations[0].properties).toEqual({ name: 'New York', country: 'US' });
  });

  it('reports polygons as shapes rather than "no geographic data"', () => {
    const result = extractGeoData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 0],
              ],
            ],
          },
          properties: { name: 'Zone' },
        },
      ],
    });
    expect(result.isGeoJSON).toBe(true);
    expect(result.locations).toHaveLength(0);
    expect(result.shapes).toHaveLength(1);
    expect(result.shapeTypes).toEqual(['Polygon']);
    expect(result.bounds).toEqual({ minLat: 0, maxLat: 10, minLng: 0, maxLng: 10 });
  });

  it('keeps LineString and MultiPolygon geometries as shapes', () => {
    const result = extractGeoData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: null,
        },
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [2, 2],
                  [3, 2],
                  [3, 3],
                  [2, 2],
                ],
              ],
            ],
          },
          properties: null,
        },
      ],
    });
    expect(result.shapeTypes).toEqual(['LineString', 'MultiPolygon']);
    expect(result.locations).toHaveLength(0);
  });

  it('expands MultiPoint into one marker per position', () => {
    const result = extractGeoData({
      type: 'Feature',
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      },
      properties: { name: 'Stops' },
    });
    expect(result.locations).toHaveLength(2);
    expect(result.locations[0]).toMatchObject({ lat: 2, lng: 1, name: 'Stops' });
  });

  it('reads a bare geometry object', () => {
    const result = extractGeoData({ type: 'Point', coordinates: [5, 6] });
    expect(result.isGeoJSON).toBe(true);
    expect(result.locations[0]).toMatchObject({ lat: 6, lng: 5 });
  });

  it('skips features whose coordinates are unusable but stays in GeoJSON mode', () => {
    const result = extractGeoData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: ['12abc', 10] },
          properties: {},
        },
        { type: 'Feature', geometry: null, properties: {} },
      ],
    });
    expect(result.isGeoJSON).toBe(true);
    expect(result.locations).toEqual([]);
    expect(result.shapes).toEqual([]);
  });

  it('names an unnamed feature by its position', () => {
    const result = extractGeoData({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: {} },
      ],
    });
    expect(result.locations[0].name).toBe('Feature 1');
  });
});

describe('shapesSignature', () => {
  const polygonDocument = (ring: number[][]) => ({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: null },
    ],
  });

  it('changes when a vertex moves even though the bounding box is identical', () => {
    const a = extractGeoData(
      polygonDocument([
        [0, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ])
    );
    const b = extractGeoData(
      polygonDocument([
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 0],
      ])
    );
    expect(a.bounds).toEqual(b.bounds);
    expect(shapesSignature(a)).not.toBe(shapesSignature(b));
  });

  it('changes when a vertex is added inside the existing bounds', () => {
    const a = extractGeoData(
      polygonDocument([
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 0],
      ])
    );
    const b = extractGeoData(
      polygonDocument([
        [0, 0],
        [10, 0],
        [10, 10],
        [5, 5],
        [0, 0],
      ])
    );
    expect(a.bounds).toEqual(b.bounds);
    expect(shapesSignature(a)).not.toBe(shapesSignature(b));
  });

  it('is stable for the same document', () => {
    const ring = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 0],
    ];
    expect(shapesSignature(extractGeoData(polygonDocument(ring)))).toBe(
      shapesSignature(extractGeoData(polygonDocument(ring)))
    );
  });
});

describe('geometryPositions', () => {
  it('walks nested rings and geometry collections', () => {
    expect(
      geometryPositions({
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [1, 2] },
          {
            type: 'Polygon',
            coordinates: [
              [
                [3, 4],
                [5, 6],
              ],
            ],
          },
        ],
      })
    ).toEqual([
      [2, 1],
      [4, 3],
      [6, 5],
    ]);
  });

  it('returns nothing for a malformed geometry', () => {
    expect(geometryPositions(null)).toEqual([]);
    expect(geometryPositions({ type: 'Point' })).toEqual([]);
  });
});

describe('bounds and the initial view', () => {
  it('returns null bounds with no points', () => {
    expect(computeBounds([])).toBeNull();
    expect(viewFromBounds(null)).toEqual({ center: [0, 0], zoom: 2 });
  });

  it('boxes every point', () => {
    expect(
      computeBounds([
        { lat: 1, lng: 2 },
        { lat: -3, lng: 40 },
      ])
    ).toEqual({ minLat: -3, maxLat: 1, minLng: 2, maxLng: 40 });
  });

  it('treats a single point as degenerate and zooms to street level, not max zoom', () => {
    const bounds = computeBounds([{ lat: 10, lng: 20 }]);
    expect(bounds).toEqual({ minLat: 10, maxLat: 10, minLng: 20, maxLng: 20 });
    expect(isDegenerateBounds({ minLat: 10, maxLat: 10, minLng: 20, maxLng: 20 })).toBe(true);
    expect(isDegenerateBounds({ minLat: 10, maxLat: 11, minLng: 20, maxLng: 20 })).toBe(false);
    expect(viewFromBounds(bounds)).toEqual({ center: [10, 20], zoom: 10 });
  });

  it('zooms out for far-apart points', () => {
    const view = viewFromBounds(
      computeBounds([
        { lat: -40, lng: -120 },
        { lat: 50, lng: 120 },
      ])
    );
    expect(view.center).toEqual([5, 0]);
    expect(view.zoom).toBe(2);
  });
});

describe('extractGeoData - depth guard', () => {
  it('reports a 100,000-level document instead of throwing RangeError', () => {
    const deep = { places: nestDeeply(100_000, 'object') };
    expect(runDepthGuarded(() => extractGeoData(deep))).toEqual({
      ok: false,
      reason: 'too-deep',
      limit: MAX_JSON_DEPTH,
    });
  });

  it('still finds coordinates in an ordinary document', () => {
    const extraction = extractGeoData({
      cities: [
        { name: 'Bogota', lat: 4.711, lng: -74.0721 },
        { name: 'Lisbon', lat: 38.7223, lng: -9.1393 },
      ],
    });
    expect(extraction.locations.map((l) => l.name)).toEqual(['Bogota', 'Lisbon']);
  });

  it('leaves wide-but-shallow documents alone', () => {
    const wide = Array.from({ length: 1_500 }, (_, i) => ({ lat: i / 100, lng: i / 100 }));
    expect(extractGeoData(wide).totalLocations).toBe(1_500);
  });
});

describe('toFeatureCollection', () => {
  it('wraps detected shapes in a GeoJSON FeatureCollection', () => {
    const extraction = extractGeoData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: { name: 'Route' },
        },
      ],
    });

    const collection = toFeatureCollection(extraction.shapes);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]).toMatchObject({
      type: 'Feature',
      geometry: { type: 'LineString' },
      properties: { name: 'Route' },
    });
  });

  it('produces an empty collection rather than null when there is nothing to draw', () => {
    expect(toFeatureCollection([])).toEqual({ type: 'FeatureCollection', features: [] });
  });
});

describe('tile provider disclosure', () => {
  it('names every host any map style can reach', () => {
    for (const style of Object.values(MAP_STYLES)) {
      expect(TILE_HOSTS).toContain(style.host);
    }
  });

  it('declares a host that matches the host the tile URL actually points at', () => {
    for (const style of Object.values(MAP_STYLES)) {
      // `{s}` is Leaflet's subdomain placeholder, not part of the real host.
      const hostname = new URL(style.url).hostname.replace(/^\{s\}\./, '');
      expect(hostname).toBe(style.host);
    }
  });

  it('lists each third party once even though two styles share CARTO', () => {
    const hosts = TILE_PROVIDERS.map((entry) => entry.host);
    expect(new Set(hosts).size).toBe(hosts.length);
    expect(TILE_PROVIDERS).toContainEqual({ provider: 'CARTO', host: 'basemaps.cartocdn.com' });
    expect(TILE_PROVIDERS).toContainEqual({ provider: 'Esri', host: 'server.arcgisonline.com' });
  });

  it('gives every disclosed provider a human-readable name', () => {
    for (const { provider, host } of TILE_PROVIDERS) {
      expect(provider.length).toBeGreaterThan(0);
      expect(host.length).toBeGreaterThan(0);
    }
  });
});

describe('tileConsentCovers', () => {
  it('accepts a grant that covers every host we might contact', () => {
    expect(tileConsentCovers(serializeTileConsent())).toBe(true);
  });

  it('ignores the order the hosts were stored in', () => {
    const reversed = JSON.stringify([...TILE_HOSTS].reverse());
    expect(tileConsentCovers(reversed)).toBe(true);
  });

  it('accepts a grant that also covers hosts we no longer use', () => {
    const stored = JSON.stringify([...TILE_HOSTS, 'tiles.example.test']);
    expect(tileConsentCovers(stored)).toBe(true);
  });

  it('rejects a grant that misses a host — the satellite provider is not implied by CARTO', () => {
    expect(tileConsentCovers(JSON.stringify(['basemaps.cartocdn.com']))).toBe(false);
    expect(tileConsentCovers(JSON.stringify(['basemaps.cartocdn.com']), TILE_HOSTS)).toBe(false);
  });

  it('re-prompts when a provider is added after the grant was stored', () => {
    const oldGrant = serializeTileConsent(['basemaps.cartocdn.com']);
    expect(tileConsentCovers(oldGrant, ['basemaps.cartocdn.com'])).toBe(true);
    expect(tileConsentCovers(oldGrant, ['basemaps.cartocdn.com', 'new.provider.test'])).toBe(false);
  });

  it('rejects the legacy "granted" flag, which named no provider at all', () => {
    expect(tileConsentCovers('granted')).toBe(false);
    expect(tileConsentCovers('"granted"')).toBe(false);
  });

  it('rejects missing, empty and unparseable values', () => {
    expect(tileConsentCovers(null)).toBe(false);
    expect(tileConsentCovers(undefined)).toBe(false);
    expect(tileConsentCovers('')).toBe(false);
    expect(tileConsentCovers('{not json')).toBe(false);
  });

  it('rejects a stored value that is not an array of hosts', () => {
    expect(tileConsentCovers('{"basemaps.cartocdn.com":true}')).toBe(false);
    expect(tileConsentCovers('true')).toBe(false);
    expect(tileConsentCovers(JSON.stringify([1, 2, 3]))).toBe(false);
  });

  it('treats an empty host list as nothing to disclose', () => {
    expect(tileConsentCovers(JSON.stringify([]), [])).toBe(true);
    expect(tileConsentCovers(JSON.stringify([]))).toBe(false);
  });

  it('keeps the storage key stable so an existing grant is still found', () => {
    expect(TILE_CONSENT_KEY).toBe('map-tiles-consent');
  });
});
