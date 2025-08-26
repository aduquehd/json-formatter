'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

interface MapViewProps {
  json: any;
}

interface LocationData {
  lat: number;
  lng: number;
  data: any;
  path: string;
  name?: string;
  properties?: any;
}

type MapStyle = 'dark' | 'light' | 'satellite';

const mapStyles: Record<MapStyle, { url: string; attribution: string; name: string }> = {
  dark: {
    name: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" style="color: #60a5fa;">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" style="color: #60a5fa;">CARTO</a>'
  },
  light: {
    name: 'Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" style="color: #1d4ed8;">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" style="color: #1d4ed8;">CARTO</a>'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

const MapViewDynamic: React.FC<MapViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isGeoJSON, setIsGeoJSON] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if dark theme is active
    const isDark = document.documentElement.classList.contains('dark');
    setMapStyle(isDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    if (!json) return;

    // Check if it's GeoJSON format
    if (json.type === 'FeatureCollection' && json.features) {
      setIsGeoJSON(true);
      const geoLocations: LocationData[] = [];
      
      json.features.forEach((feature: any, index: number) => {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates;
          if (feature.geometry.type === 'Point' && coords.length >= 2) {
            geoLocations.push({
              lng: coords[0],
              lat: coords[1],
              data: feature,
              path: `features[${index}]`,
              name: feature.properties?.name || feature.properties?.title || `Feature ${index}`,
              properties: feature.properties
            });
          }
        }
      });
      
      setLocations(geoLocations);
    } else if (json.type === 'Feature' && json.geometry) {
      // Single GeoJSON feature
      setIsGeoJSON(true);
      if (json.geometry.type === 'Point' && json.geometry.coordinates) {
        const coords = json.geometry.coordinates;
        setLocations([{
          lng: coords[0],
          lat: coords[1],
          data: json,
          path: 'root',
          name: json.properties?.name || 'Feature',
          properties: json.properties
        }]);
      }
    } else {
      // Regular JSON - search for location data
      setIsGeoJSON(false);
      const extractLocations = (obj: any, path: string = ''): LocationData[] => {
        const locs: LocationData[] = [];
        
        if (obj && typeof obj === 'object') {
          // Check for various location formats
          if (
            (obj.lat && obj.lng) ||
            (obj.latitude && obj.longitude) ||
            (obj.lat && obj.lon) ||
            (obj.latitude && obj.lng) ||
            (obj.lat && obj.longitude) ||
            (obj.coordinates && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) ||
            (obj.location && typeof obj.location === 'object')
          ) {
            let lat = null;
            let lng = null;
            
            if (obj.lat !== undefined && obj.lng !== undefined) {
              lat = obj.lat;
              lng = obj.lng;
            } else if (obj.latitude !== undefined && obj.longitude !== undefined) {
              lat = obj.latitude;
              lng = obj.longitude;
            } else if (obj.lat !== undefined && obj.lon !== undefined) {
              lat = obj.lat;
              lng = obj.lon;
            } else if (obj.latitude !== undefined && obj.lng !== undefined) {
              lat = obj.latitude;
              lng = obj.lng;
            } else if (obj.lat !== undefined && obj.longitude !== undefined) {
              lat = obj.lat;
              lng = obj.longitude;
            } else if (obj.coordinates && Array.isArray(obj.coordinates)) {
              lng = obj.coordinates[0];
              lat = obj.coordinates[1];
            } else if (obj.location) {
              if (obj.location.lat !== undefined && obj.location.lng !== undefined) {
                lat = obj.location.lat;
                lng = obj.location.lng;
              } else if (obj.location.latitude !== undefined && obj.location.longitude !== undefined) {
                lat = obj.location.latitude;
                lng = obj.location.longitude;
              }
            }
            
            if (lat !== null && lng !== null && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
              locs.push({
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                data: obj,
                path,
                name: obj.name || obj.city || obj.title || obj.label || obj.place || path
              });
            }
          }
          
          // Recursive search - handle arrays properly
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                const newPath = path ? `${path}[${index}]` : `[${index}]`;
                locs.push(...extractLocations(item, newPath));
              }
            });
          } else {
            Object.entries(obj).forEach(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                const newPath = path ? `${path}.${key}` : key;
                locs.push(...extractLocations(value, newPath));
              }
            });
          }
        }
        
        return locs;
      };

      setLocations(extractLocations(json));
    }
  }, [json]);

  // Calculate center and bounds
  const mapConfig = useMemo(() => {
    if (locations.length === 0) {
      return { center: [0, 0] as [number, number], zoom: 2 };
    }

    if (locations.length === 1) {
      return { center: [locations[0].lat, locations[0].lng] as [number, number], zoom: 10 };
    }

    // Calculate bounds for multiple locations
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate appropriate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 2;
    if (maxDiff < 0.01) zoom = 15;
    else if (maxDiff < 0.1) zoom = 12;
    else if (maxDiff < 1) zoom = 10;
    else if (maxDiff < 10) zoom = 6;
    else if (maxDiff < 50) zoom = 4;
    else if (maxDiff < 100) zoom = 3;
    
    return { center: [centerLat, centerLng] as [number, number], zoom };
  }, [locations]);

  if (!json) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">{mounted ? t('map.noData') || 'No JSON data available' : 'No JSON data available'}</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {mounted ? t('map.noGeoData') : 'No geographic data found'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {mounted ? t('map.supportedFormats') || 'Map view supports the following formats:' : 'Map view supports the following formats:'}
          </p>
          <ul className="text-sm text-[var(--text-muted)] space-y-1 max-w-md mx-auto">
            <li className="text-center">• GeoJSON FeatureCollection or Feature</li>
            <li className="text-center">• Objects with lat/lng or latitude/longitude</li>
            <li className="text-center">• Objects with coordinates array [lng, lat]</li>
            <li className="text-center">• Objects with location.lat/location.lng</li>
          </ul>
          <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)]">
              {mounted ? t('map.tip') || 'Tip: For GeoJSON, ensure geometry.type is "Point" and coordinates are [longitude, latitude]' : 'Tip: For GeoJSON, ensure geometry.type is "Point" and coordinates are [longitude, latitude]'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Location counter */}
      <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg border border-[var(--border-color)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {locations.length} {mounted ? (locations.length === 1 ? t('map.locationSingular') || 'location found' : t('map.locationPlural') || 'locations found') : `location${locations.length !== 1 ? 's' : ''} found`}
        </p>
        {isGeoJSON && (
          <p className="text-xs text-[var(--text-secondary)]">{mounted ? t('map.geoJSONDetected') || 'GeoJSON format detected' : 'GeoJSON format detected'}</p>
        )}
      </div>

      {/* Map style switcher - positioned below zoom controls */}
      <div className="absolute top-28 left-3 z-[1000] bg-white dark:bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg border border-[var(--border-color)]">
        <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">{mounted ? t('map.mapStyle') || 'Map Style' : 'Map Style'}</label>
        <select 
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value as MapStyle)}
          className="text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(mapStyles).map(([key, style]) => (
            <option key={key} value={key}>{style.name}</option>
          ))}
        </select>
      </div>
      
      <MapContainer
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={mapStyles[mapStyle].url}
          attribution={mapStyles[mapStyle].attribution}
        />
        
        {locations.map((location, index) => {
          // Create custom icon with better colors
          const customIcon = L.divIcon({
            html: `
              <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

          return (
            <Marker key={index} position={[location.lat, location.lng]} icon={customIcon}>
              <Popup>
                <div className="text-sm p-1 bg-white dark:bg-gray-800 rounded-lg">
                  {location.name && (
                    <div className="font-bold text-lg mb-2 text-blue-700 dark:text-cyan-400">{location.name}</div>
                  )}
                  {location.properties && (
                    <div className="space-y-1">
                      {location.properties.country && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Country:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{location.properties.country}</span>
                        </div>
                      )}
                      {location.properties.population && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Population:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{location.properties.population.toLocaleString()}</span>
                        </div>
                      )}
                      {location.properties.state && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">State/Region:</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">{location.properties.state}</span>
                        </div>
                      )}
                      {location.properties.gdp && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">GDP:</span>
                          <span className="text-orange-600 dark:text-orange-400 font-medium">${location.properties.gdp}B</span>
                        </div>
                      )}
                      {location.properties.timezone && (
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Timezone:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{location.properties.timezone}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Show other relevant data fields */}
                  {location.data && !location.properties && (
                    <div className="space-y-1">
                      {Object.entries(location.data).filter(([key]) => 
                        !['lat', 'lng', 'latitude', 'longitude', 'coordinates', 'location'].includes(key.toLowerCase())
                      ).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-1">Coordinates</div>
                    <div className="text-xs space-y-0.5">
                      <div className="text-gray-600 dark:text-gray-400">Lat: <span className="text-red-600 dark:text-red-400 font-mono">{location.lat.toFixed(4)}°</span></div>
                      <div className="text-gray-600 dark:text-gray-400">Lng: <span className="text-red-600 dark:text-red-400 font-mono">{location.lng.toFixed(4)}°</span></div>
                    </div>
                  </div>
                  {!isGeoJSON && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Path: <span className="font-mono text-gray-600 dark:text-gray-300">{location.path}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapViewDynamic;