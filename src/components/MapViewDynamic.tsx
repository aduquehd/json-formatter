'use client';

import L from 'leaflet';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useThemeContext } from '@/components/ThemeProvider';
import {
  EMPTY_EXTRACTION,
  extractGeoData,
  type GeoLocation,
  MAP_STYLES,
  type MapStyleId,
  serializeTileConsent,
  shapesSignature,
  TILE_CONSENT_KEY,
  TILE_PROVIDERS,
  tileConsentCovers,
  toDisplayString,
  toFeatureCollection,
  viewFromBounds,
} from '@/utils/geoDetect';
import { runDepthGuarded } from '@/utils/jsonWalk';
import DepthLimitNotice from './DepthLimitNotice';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  json: any;
  /**
   * Whether `json` is a parsed document at all. Carried explicitly because `null`, `0`,
   * `false` and `""` are valid JSON documents that a truthiness test reads as "nothing
   * loaded". Optional only until `MapView` forwards it; the fallback still distinguishes
   * every falsy document except `null`.
   */
  isValid?: boolean;
}

/**
 * Tile requests are z/x/y derived from the coordinates in the user's private document, sent to a
 * third party along with their IP. The app promises the JSON never leaves the browser, so tiles
 * stay off until the user asks for them; the choice is remembered per browser.
 *
 * The grant is stored as the list of hosts disclosed at the time (see `tileConsentCovers`), so a
 * provider added later cannot inherit an agreement that never named it.
 */
function readTileConsent(): boolean {
  try {
    return tileConsentCovers(localStorage.getItem(TILE_CONSENT_KEY));
  } catch {
    return false;
  }
}

function storeTileConsent(): void {
  try {
    localStorage.setItem(TILE_CONSENT_KEY, serializeTileConsent());
  } catch {
    // Private mode or blocked storage — consent then lasts for this session only.
  }
}

/**
 * Hoisted so every marker shares one icon instance: react-leaflet calls `setIcon` whenever the
 * icon prop identity changes, which re-created all marker DOM on each render.
 */
const MARKER_ICON = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  className: 'custom-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const SHAPE_STYLE = {
  color: '#3b82f6',
  weight: 2,
  fillColor: '#3b82f6',
  fillOpacity: 0.2,
};

const shapePointToLayer = (_feature: unknown, latlng: L.LatLng) =>
  L.marker(latlng, { icon: MARKER_ICON });

/** Popup content is built with `textContent`, never HTML, so user JSON can never inject markup. */
const bindShapePopup = (feature: any, layer: L.Layer): void => {
  const container = document.createElement('div');
  container.className = 'text-sm';

  const geometryType = toDisplayString(feature?.geometry?.type) || 'Shape';
  const title = document.createElement('div');
  title.className = 'font-bold mb-1';
  title.textContent = toDisplayString(feature?.properties?.name) || geometryType;
  container.appendChild(title);

  const properties = feature?.properties;
  if (properties && typeof properties === 'object') {
    for (const [key, value] of Object.entries(properties).slice(0, 5)) {
      const row = document.createElement('div');
      row.textContent = `${key.replace(/_/g, ' ')}: ${toDisplayString(value)}`;
      container.appendChild(row);
    }
  }

  const type = document.createElement('div');
  type.className = 'mt-1 text-xs opacity-70';
  type.textContent = geometryType;
  container.appendChild(type);

  layer.bindPopup(container);
};

const formatNumeric = (value: unknown): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString()
    : toDisplayString(value);

/** Well-known GeoJSON properties that get their own highlighted row in a marker popup. */
const PROPERTY_ROWS: Array<{
  key: string;
  label: string;
  valueClass: string;
  format?: (value: unknown) => string;
}> = [
  { key: 'country', label: 'Country', valueClass: 'text-emerald-600 dark:text-emerald-400' },
  {
    key: 'population',
    label: 'Population',
    valueClass: 'text-blue-600 dark:text-blue-400',
    format: formatNumeric,
  },
  { key: 'state', label: 'State/Region', valueClass: 'text-purple-600 dark:text-purple-400' },
  {
    key: 'gdp',
    label: 'GDP',
    valueClass: 'text-orange-600 dark:text-orange-400',
    format: (value) => `$${toDisplayString(value)}B`,
  },
  { key: 'timezone', label: 'Timezone', valueClass: 'text-indigo-600 dark:text-indigo-400' },
];

/**
 * `MapContainer`'s `center`/`zoom` are read once on mount in react-leaflet 5, so an in-place data
 * change never recentred the map. This child re-fits from inside the map context instead; bounds
 * arrive as four numbers so effect dependencies compare by value.
 */
const FitToData: React.FC<{
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}> = ({ minLat, maxLat, minLng, maxLng }) => {
  const map = useMap();

  useEffect(() => {
    let frame = 0;
    let attempts = 0;

    const applyView = () => {
      // A container that has not been laid out yet reports a zero size, and fitBounds would
      // silently commit a max-zoom view that nothing later corrects — so wait a few frames.
      const size = map.getSize();
      if ((size.x === 0 || size.y === 0) && attempts < 10) {
        attempts += 1;
        frame = requestAnimationFrame(applyView);
        return;
      }

      if (minLat === maxLat && minLng === maxLng) {
        // Zero-area bounds: fitBounds would slam to max zoom, so pick a sane single-pin view.
        map.setView([minLat, minLng], 10);
        return;
      }

      map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { padding: [40, 40] }
      );
    };

    applyView();
    return () => cancelAnimationFrame(frame);
  }, [map, minLat, maxLat, minLng, maxLng]);

  return null;
};

const MarkerPopup: React.FC<{ location: GeoLocation; isGeoJSON: boolean }> = ({
  location,
  isGeoJSON,
}) => {
  const properties =
    location.properties && typeof location.properties === 'object' ? location.properties : null;

  return (
    <div className="text-sm p-1 bg-white dark:bg-gray-800 rounded-lg">
      {location.name && (
        <div className="font-bold text-lg mb-2 text-blue-700 dark:text-cyan-400">
          {location.name}
        </div>
      )}
      {properties && (
        <div className="space-y-1">
          {PROPERTY_ROWS.map((row) => {
            const raw = (properties as Record<string, unknown>)[row.key];
            if (toDisplayString(raw) === '') return null;
            return (
              <div key={row.key} className="flex justify-between gap-2">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{row.label}:</span>
                <span className={`${row.valueClass} font-medium`}>
                  {row.format ? row.format(raw) : toDisplayString(raw)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {location.data && !properties && (
        <div className="space-y-1">
          {Object.entries(location.data)
            .filter(
              ([key]) =>
                ![
                  'lat',
                  'lng',
                  'lon',
                  'long',
                  'latitude',
                  'longitude',
                  'coordinates',
                  'location',
                ].includes(key.toLowerCase())
            )
            .slice(0, 5)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {toDisplayString(value)}
                </span>
              </div>
            ))}
        </div>
      )}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-1">
          Coordinates
        </div>
        <div className="text-xs space-y-0.5">
          <div className="text-gray-600 dark:text-gray-400">
            Lat:{' '}
            <span className="text-red-600 dark:text-red-400 font-mono">
              {location.lat.toFixed(4)}°
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Lng:{' '}
            <span className="text-red-600 dark:text-red-400 font-mono">
              {location.lng.toFixed(4)}°
            </span>
          </div>
        </div>
      </div>
      {!isGeoJSON && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Path: <span className="font-mono text-gray-600 dark:text-gray-300">{location.path}</span>
        </div>
      )}
    </div>
  );
};

const MapViewDynamic: React.FC<MapViewProps> = ({ json, isValid }) => {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const [styleOverride, setStyleOverride] = useState<MapStyleId | null>(null);
  // Read once during the first render: this component only ever runs in the browser
  // (`MapView` loads it with `ssr: false`), so there is no server markup to mismatch.
  const [tilesEnabled, setTilesEnabled] = useState(readTileConsent);

  // Follow the app theme until the user picks a style explicitly, so toggling the theme
  // no longer leaves a dark basemap on a light page.
  const mapStyle: MapStyleId = styleOverride ?? (theme === 'dark' ? 'dark' : 'light');
  const activeStyle = MAP_STYLES[mapStyle];

  // The extractor walks the whole document looking for coordinates, so it is one
  // of the recursions a deeply nested document kills. Guarded here rather than
  // inside `extractGeoData` so the extractor stays a pure function.
  const extraction = runDepthGuarded(() => extractGeoData(json));
  const geo = extraction.ok ? extraction.value : EMPTY_EXTRACTION;
  const { locations, totalLocations, shapes, shapeTypes, isGeoJSON, bounds } = geo;
  const initialView = viewFromBounds(bounds);

  const enableTiles = () => {
    storeTileConsent();
    setTilesEnabled(true);
  };

  // `!json` would call `0`, `false`, `""` and `null` "no data"; they are all valid documents.
  const hasDocument = isValid ?? (json !== null && json !== undefined);

  if (!hasDocument) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          {t('map.noData', { defaultValue: 'No JSON data available' })}
        </p>
      </div>
    );
  }

  if (!extraction.ok) {
    return (
      <div className="h-full flex items-center justify-center">
        <DepthLimitNotice limit={extraction.limit} />
      </div>
    );
  }

  if (locations.length === 0 && shapes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t('map.noGeoData', { defaultValue: 'No geographic data found' })}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t('map.supportedFormats', {
              defaultValue: 'Map view supports the following formats:',
            })}
          </p>
          <ul className="text-sm text-[var(--text-muted)] space-y-1 max-w-md mx-auto">
            <li className="text-center">• GeoJSON FeatureCollection or Feature</li>
            <li className="text-center">• Objects with lat/lng or latitude/longitude</li>
            <li className="text-center">• Objects with coordinates array [lng, lat]</li>
            <li className="text-center">• Objects with location.lat/location.lng</li>
          </ul>
          <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)]">
              {t('map.tip', {
                defaultValue:
                  'Tip: For GeoJSON, ensure geometry.type is "Point" and coordinates are [longitude, latitude]',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Location counter */}
      <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg border border-[var(--border-color)] max-w-[16rem]">
        {locations.length > 0 && (
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {locations.length}{' '}
            {locations.length === 1
              ? t('map.locationSingular', { defaultValue: 'location found' })
              : t('map.locationPlural', { defaultValue: 'locations found' })}
          </p>
        )}
        {totalLocations > locations.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t('map.markerCap', {
              defaultValue: 'Showing the first {{shown}} of {{total}} — the rest are not plotted.',
              shown: locations.length,
              total: totalLocations,
            })}
          </p>
        )}
        {shapes.length > 0 && (
          <p className="text-xs text-[var(--text-secondary)]">
            {t('map.shapesFound', {
              defaultValue: '{{total}} shape(s) drawn: {{types}}',
              total: shapes.length,
              types: shapeTypes.join(', '),
            })}
          </p>
        )}
        {isGeoJSON && (
          <p className="text-xs text-[var(--text-secondary)]">
            {t('map.geoJSONDetected', { defaultValue: 'GeoJSON format detected' })}
          </p>
        )}
      </div>

      {/* Tile opt-in / map style switcher - positioned below zoom controls */}
      <div className="absolute top-28 left-3 z-[1000] bg-white dark:bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg border border-[var(--border-color)] max-w-[15rem]">
        {tilesEnabled ? (
          <>
            <label
              htmlFor="map-style-select"
              className="text-xs font-semibold text-[var(--text-primary)] block mb-1"
            >
              {t('map.mapStyle', { defaultValue: 'Map Style' })}
            </label>
            <select
              id="map-style-select"
              value={mapStyle}
              onChange={(e) => setStyleOverride(e.target.value as MapStyleId)}
              className="text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(MAP_STYLES).map(([key, style]) => (
                <option key={key} value={key}>
                  {style.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              {t('map.tilesOffTitle', { defaultValue: 'Background map is off' })}
            </p>
            <p className="text-[11px] leading-snug text-[var(--text-secondary)]">
              {t('map.tilesOffBody', {
                defaultValue:
                  'Your JSON stays in the browser. Loading tiles sends map image requests to the third parties listed here, for any map style you pick, and reveals the area you are viewing and your IP address to them.',
              })}
            </p>
            {/* Every provider any style can reach, not just the selected one: one grant covers
                them all, so the panel has to name them all. */}
            <ul className="text-[11px] leading-snug text-[var(--text-secondary)] space-y-0.5">
              {TILE_PROVIDERS.map(({ provider, host }) => (
                <li key={host}>
                  <span className="font-semibold">{provider}</span>{' '}
                  <span className="font-mono opacity-80">{host}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={enableTiles}
              className="w-full cursor-pointer text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1"
            >
              {t('map.tilesLoad', { defaultValue: 'Load map tiles' })}
            </button>
          </div>
        )}
      </div>

      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        style={{ height: '100%', width: '100%', background: 'var(--bg-secondary)' }}
        scrollWheelZoom={true}
      >
        {tilesEnabled && <TileLayer url={activeStyle.url} attribution={activeStyle.attribution} />}

        {bounds && (
          <FitToData
            minLat={bounds.minLat}
            maxLat={bounds.maxLat}
            minLng={bounds.minLng}
            maxLng={bounds.maxLng}
          />
        )}

        {shapes.length > 0 && (
          <GeoJSON
            key={shapesSignature(geo)}
            data={toFeatureCollection(shapes)}
            style={SHAPE_STYLE}
            pointToLayer={shapePointToLayer}
            onEachFeature={bindShapePopup}
          />
        )}

        {locations.map((location, index) => (
          <Marker
            key={`${location.path}-${index}`}
            position={[location.lat, location.lng]}
            icon={MARKER_ICON}
          >
            <Popup>
              <MarkerPopup location={location} isGeoJSON={isGeoJSON} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapViewDynamic;
