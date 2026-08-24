/**
 * Pure geographic-data detection for the map view.
 *
 * Everything the map needs to decide *what* to plot lives here so it can be unit tested
 * without a DOM: coordinate validation, GeoJSON walking, plain-object scanning, bounds and
 * the initial viewport. The component keeps only the rendering.
 *
 * The tile-provider catalogue and the tile-consent bookkeeping live here too, for the same
 * reason: the promise that no third party is contacted before the user agrees is only as
 * good as the code that decides "agreed", and that decision has to be testable.
 */

import type { LayerGroup } from 'leaflet';
import { assertJsonDepth } from './jsonWalk';

/** Hard cap on rendered markers — a document with 50k coordinate objects otherwise hangs the tab. */
export const MAX_MARKERS = 2000;

export interface GeoLocation {
  lat: number;
  lng: number;
  data: any;
  path: string;
  /** Always a display-ready string, never a raw object (see `toDisplayString`). */
  name: string;
  properties?: any;
}

/** A GeoJSON feature whose geometry is not a point — drawn through Leaflet's GeoJSON layer. */
export interface GeoShape {
  feature: any;
  path: string;
  type: string;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GeoExtraction {
  /** Markers to render, capped at `maxLocations`. */
  locations: GeoLocation[];
  /** How many markers were detected before the cap was applied. */
  totalLocations: number;
  shapes: GeoShape[];
  /** Distinct geometry types among `shapes`, for the "also found" notice. */
  shapeTypes: string[];
  isGeoJSON: boolean;
  bounds: GeoBounds | null;
}

const LAT_KEYS = ['lat', 'latitude'] as const;
const LNG_KEYS = ['lng', 'lon', 'long', 'longitude'] as const;
const NAME_KEYS = ['name', 'city', 'title', 'label', 'place'] as const;

const GEOMETRY_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
]);

/**
 * Coerce an arbitrary JSON value into something React can render as a child.
 *
 * React throws "Objects are not valid as a React child" for objects and arrays, so every
 * value that reaches JSX must pass through here. `null`/`undefined` become the empty string
 * so callers can treat "nothing to show" as falsy.
 */
export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
  } catch {
    return String(value);
  }
}

/**
 * Accept only genuinely scalar, finite coordinate values.
 *
 * Deliberately strict: `null` (`Number(null) === 0` would plot at Null Island), booleans,
 * empty strings, arrays (`Number([5]) === 5`) and objects are all rejected, and `'12abc'`
 * fails where `parseFloat('12abc')` would have returned `12`.
 */
export function toCoordinateNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidLatitude(value: unknown): boolean {
  const lat = toCoordinateNumber(value);
  return lat !== null && lat >= -90 && lat <= 90;
}

export function isValidLongitude(value: unknown): boolean {
  const lng = toCoordinateNumber(value);
  return lng !== null && lng >= -180 && lng <= 180;
}

/** Build a validated point, or `null` if either half is missing, non-scalar or out of range. */
export function toLatLng(
  latValue: unknown,
  lngValue: unknown
): { lat: number; lng: number } | null {
  const lat = toCoordinateNumber(latValue);
  const lng = toCoordinateNumber(lngValue);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Read a GeoJSON position — `[longitude, latitude]`, note the order — from a coordinates value.
 *
 * A Polygon's `[[[x, y], ...]]` is rejected because its members are arrays rather than scalars,
 * instead of being coerced into a bogus point.
 */
export function pointFromCoordinates(coordinates: unknown): { lat: number; lng: number } | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  return toLatLng(coordinates[1], coordinates[0]);
}

/** First non-empty of name/city/title/label/place, coerced to a string; `fallback` otherwise. */
export function pickDisplayName(value: unknown, fallback: string): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of NAME_KEYS) {
      if (!Object.hasOwn(record, key)) continue;
      const text = toDisplayString(record[key]);
      if (text !== '') return text;
    }
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Every valid position inside a coordinates tree, as `[lat, lng]` pairs. */
function collectPositions(coordinates: unknown, out: Array<[number, number]>, depth = 0): void {
  assertJsonDepth(depth);
  if (!Array.isArray(coordinates)) return;
  const point = pointFromCoordinates(coordinates);
  if (point) {
    out.push([point.lat, point.lng]);
    return;
  }
  for (const child of coordinates) collectPositions(child, out, depth + 1);
}

/**
 * Every valid position of a geometry, including nested GeometryCollection members.
 *
 * `depth` is optional and trails the signature, so existing one-argument callers
 * are unaffected — but never pass this to `map`/`forEach` directly, which would
 * feed the element index in as a depth.
 */
export function geometryPositions(geometry: unknown, depth = 0): Array<[number, number]> {
  assertJsonDepth(depth);
  const out: Array<[number, number]> = [];
  if (!isRecord(geometry)) return out;
  if (Array.isArray(geometry.geometries)) {
    for (const child of geometry.geometries) out.push(...geometryPositions(child, depth + 1));
    return out;
  }
  collectPositions(geometry.coordinates, out, depth + 1);
  return out;
}

function matchLatLngPair(obj: Record<string, unknown>): { lat: number; lng: number } | null {
  for (const latKey of LAT_KEYS) {
    if (!Object.hasOwn(obj, latKey)) continue;
    for (const lngKey of LNG_KEYS) {
      if (!Object.hasOwn(obj, lngKey)) continue;
      const point = toLatLng(obj[latKey], obj[lngKey]);
      if (point) return point;
    }
  }
  return null;
}

interface PlainMatch {
  lat: number;
  lng: number;
  /** Nested object the coordinates came from, so the walk does not plot it a second time. */
  consumed?: object;
}

function matchPlainObject(obj: Record<string, unknown>): PlainMatch | null {
  const direct = matchLatLngPair(obj);
  if (direct) return direct;

  const fromCoordinates = pointFromCoordinates(obj.coordinates);
  if (fromCoordinates) return fromCoordinates;

  if (isRecord(obj.location)) {
    const nested = matchLatLngPair(obj.location) ?? pointFromCoordinates(obj.location.coordinates);
    if (nested) return { ...nested, consumed: obj.location };
  }

  return null;
}

function extractFromPlainJson(root: unknown): GeoLocation[] {
  const found: GeoLocation[] = [];
  const consumed = new Set<object>();

  const visit = (node: unknown, path: string, depth: number): void => {
    assertJsonDepth(depth);
    if (isRecord(node)) {
      const match = matchPlainObject(node);
      if (match) {
        found.push({
          lat: match.lat,
          lng: match.lng,
          data: node,
          path: path || 'root',
          name: pickDisplayName(node, path || 'root'),
        });
        if (match.consumed) consumed.add(match.consumed);
      }

      for (const [key, value] of Object.entries(node)) {
        if (value && typeof value === 'object' && !consumed.has(value)) {
          visit(value, path ? `${path}.${key}` : key, depth + 1);
        }
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        if (item && typeof item === 'object' && !consumed.has(item)) {
          visit(item, path ? `${path}[${index}]` : `[${index}]`, depth + 1);
        }
      });
    }
  };

  visit(root, '', 0);
  return found;
}

function readFeature(
  feature: unknown,
  path: string,
  index: number,
  locations: GeoLocation[],
  shapes: GeoShape[]
): void {
  if (!isRecord(feature)) return;
  const geometry = isRecord(feature.geometry) ? feature.geometry : null;
  if (!geometry) return;

  const type = typeof geometry.type === 'string' ? geometry.type : '';
  const properties = isRecord(feature.properties) ? feature.properties : undefined;
  const name = pickDisplayName(properties, `Feature ${index + 1}`);

  if (type === 'Point') {
    const point = pointFromCoordinates(geometry.coordinates);
    if (point) locations.push({ ...point, data: feature, path, name, properties });
    return;
  }

  if (type === 'MultiPoint') {
    const positions: Array<[number, number]> = [];
    collectPositions(geometry.coordinates, positions);
    positions.forEach(([lat, lng], pointIndex) => {
      locations.push({
        lat,
        lng,
        data: feature,
        path: `${path}.geometry.coordinates[${pointIndex}]`,
        name,
        properties,
      });
    });
    return;
  }

  if (GEOMETRY_TYPES.has(type)) {
    shapes.push({
      feature: { type: 'Feature', geometry, properties: properties ?? null },
      path,
      type,
    });
  }
}

/** Smallest box containing every point, or `null` when there is nothing to fit. */
export function computeBounds(points: Array<{ lat: number; lng: number }>): GeoBounds | null {
  if (points.length === 0) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const { lat, lng } of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

/** True when the bounds have no area — a single point, or several stacked on one spot. */
export function isDegenerateBounds(bounds: GeoBounds): boolean {
  return bounds.minLat === bounds.maxLat && bounds.minLng === bounds.maxLng;
}

/** Centre and zoom for the initial `MapContainer` mount (in-place updates use `fitBounds`). */
export function viewFromBounds(bounds: GeoBounds | null): {
  center: [number, number];
  zoom: number;
} {
  if (!bounds) return { center: [0, 0], zoom: 2 };

  const center: [number, number] = [
    (bounds.minLat + bounds.maxLat) / 2,
    (bounds.minLng + bounds.maxLng) / 2,
  ];

  const maxDiff = Math.max(bounds.maxLat - bounds.minLat, bounds.maxLng - bounds.minLng);
  if (maxDiff === 0) return { center, zoom: 10 };

  let zoom = 2;
  if (maxDiff < 0.01) zoom = 15;
  else if (maxDiff < 0.1) zoom = 12;
  else if (maxDiff < 1) zoom = 10;
  else if (maxDiff < 10) zoom = 6;
  else if (maxDiff < 50) zoom = 4;
  else if (maxDiff < 100) zoom = 3;

  return { center, zoom };
}

/**
 * Cheap content signature for the shape layer.
 *
 * react-leaflet's `<GeoJSON data>` is not reactive — the layer is built once on mount — so this
 * drives its `key` and forces a remount when the underlying document actually changes. It folds
 * in a digest of every vertex, because moving an interior vertex changes the drawn shape without
 * changing the count, the types or the bounding box.
 */
export function shapesSignature(extraction: GeoExtraction): string {
  let vertexCount = 0;
  let latSum = 0;
  let lngSum = 0;
  for (const shape of extraction.shapes) {
    for (const [lat, lng] of geometryPositions(shape.feature.geometry)) {
      vertexCount += 1;
      latSum += lat;
      lngSum += lng;
    }
  }

  const { bounds } = extraction;
  const box = bounds
    ? `${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}`
    : 'none';
  const vertices = `${vertexCount},${Math.round(latSum * 1e6)},${Math.round(lngSum * 1e6)}`;
  return `${extraction.shapes.length}|${extraction.shapeTypes.join(',')}|${box}|${vertices}`;
}

/**
 * GeoJSON's own `FeatureCollection`, borrowed from Leaflet's types.
 *
 * `@types/geojson` is an indirect dependency of `@types/leaflet`, so `import from 'geojson'`
 * does not resolve from application code under pnpm's non-hoisted layout. Reaching the type
 * through a Leaflet signature that returns it keeps the real GeoJSON type without adding a
 * dependency — and without an `as` cast at the call site.
 */
export type GeoFeatureCollection = Extract<
  ReturnType<LayerGroup['toGeoJSON']>,
  { type: 'FeatureCollection' }
>;

/** Wrap detected shapes as the FeatureCollection react-leaflet's `<GeoJSON data>` expects. */
export function toFeatureCollection(shapes: GeoShape[]): GeoFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: shapes.map((shape) => shape.feature),
  };
}

export const EMPTY_EXTRACTION: GeoExtraction = {
  locations: [],
  totalLocations: 0,
  shapes: [],
  shapeTypes: [],
  isGeoJSON: false,
  bounds: null,
};

/**
 * Find everything plottable in a parsed JSON document.
 *
 * Handles GeoJSON (FeatureCollection, Feature, bare geometry) and plain objects carrying
 * lat/lng, latitude/longitude, a `coordinates` position or a nested `location`.
 *
 * Throws `JsonDepthLimitError` past `MAX_JSON_DEPTH`; the map view runs it inside
 * `runDepthGuarded` and shows the "nested too deeply" panel instead.
 */
export function extractGeoData(json: unknown, maxLocations: number = MAX_MARKERS): GeoExtraction {
  if (json === null || json === undefined || typeof json !== 'object') return EMPTY_EXTRACTION;

  const locations: GeoLocation[] = [];
  const shapes: GeoShape[] = [];
  let isGeoJSON = false;

  const record = json as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type : '';

  if (type === 'FeatureCollection' && Array.isArray(record.features)) {
    isGeoJSON = true;
    record.features.forEach((feature, index) => {
      readFeature(feature, `features[${index}]`, index, locations, shapes);
    });
  } else if (type === 'Feature') {
    isGeoJSON = true;
    readFeature(record, 'root', 0, locations, shapes);
  } else if (GEOMETRY_TYPES.has(type)) {
    isGeoJSON = true;
    readFeature(
      { type: 'Feature', geometry: record, properties: null },
      'root',
      0,
      locations,
      shapes
    );
  } else {
    locations.push(...extractFromPlainJson(json));
  }

  const totalLocations = locations.length;
  const visible = totalLocations > maxLocations ? locations.slice(0, maxLocations) : locations;

  const boundsPoints: Array<{ lat: number; lng: number }> = visible.map(({ lat, lng }) => ({
    lat,
    lng,
  }));
  for (const shape of shapes) {
    for (const [lat, lng] of geometryPositions(shape.feature.geometry)) {
      boundsPoints.push({ lat, lng });
    }
  }

  return {
    locations: visible,
    totalLocations,
    shapes,
    shapeTypes: [...new Set(shapes.map((shape) => shape.type))],
    isGeoJSON,
    bounds: computeBounds(boundsPoints),
  };
}

/* ------------------------------------------------------------------ *
 * Tile providers and consent
 * ------------------------------------------------------------------ */

export type MapStyleId = 'dark' | 'light' | 'satellite';

export interface TileStyle {
  name: string;
  /** Company shown to the user in the consent panel. */
  provider: string;
  /** Host the tile requests actually go to — the thing being disclosed. */
  host: string;
  url: string;
  attribution: string;
}

export const MAP_STYLES: Record<MapStyleId, TileStyle> = {
  dark: {
    name: 'Dark',
    provider: 'CARTO',
    host: 'basemaps.cartocdn.com',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" style="color: #60a5fa;">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" style="color: #60a5fa;">CARTO</a>',
  },
  light: {
    name: 'Light',
    provider: 'CARTO',
    host: 'basemaps.cartocdn.com',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" style="color: #1d4ed8;">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" style="color: #1d4ed8;">CARTO</a>',
  },
  satellite: {
    name: 'Satellite',
    provider: 'Esri',
    host: 'server.arcgisonline.com',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

/**
 * Every third party a tile request can reach, deduplicated by host and derived from
 * `MAP_STYLES` rather than written out by hand — a style added later shows up in the
 * consent panel automatically instead of being silently contacted.
 */
export const TILE_PROVIDERS: ReadonlyArray<{ provider: string; host: string }> = Object.values(
  MAP_STYLES
).reduce<Array<{ provider: string; host: string }>>((providers, style) => {
  if (!providers.some((entry) => entry.host === style.host)) {
    providers.push({ provider: style.provider, host: style.host });
  }
  return providers;
}, []);

/** The hosts a grant has to cover before any tile is fetched. */
export const TILE_HOSTS: readonly string[] = TILE_PROVIDERS.map((entry) => entry.host);

export const TILE_CONSENT_KEY = 'map-tiles-consent';

/** The stored grant: the exact list of hosts the user was shown when they agreed. */
export function serializeTileConsent(hosts: readonly string[] = TILE_HOSTS): string {
  return JSON.stringify([...hosts]);
}

/**
 * True only when a stored grant covers *every* host we might contact.
 *
 * The grant records hosts rather than a bare "granted" flag so that adding a provider
 * invalidates it: the user is asked again, naming the new third party, instead of the old
 * agreement quietly authorising it. Comparison is set-based, so reordering `MAP_STYLES`
 * does not throw the grant away.
 */
export function tileConsentCovers(
  stored: string | null | undefined,
  hosts: readonly string[] = TILE_HOSTS
): boolean {
  if (!stored) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    // Anything unparseable — including the legacy `'granted'` flag, which named no host
    // and therefore never was informed consent — counts as no grant at all.
    return false;
  }

  if (!Array.isArray(parsed)) return false;
  const granted = new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
  return hosts.every((host) => granted.has(host));
}
