'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

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

interface MapViewProps {
  json: any;
}

const MapView: React.FC<MapViewProps> = ({ json }) => {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (!json) return;

    const extractLocations = (obj: any, path: string = ''): any[] => {
      const locs: any[] = [];
      
      if (obj && typeof obj === 'object') {
        // Check if object has lat/lng or coordinates
        if (
          (obj.lat && obj.lng) ||
          (obj.latitude && obj.longitude) ||
          (obj.coordinates && Array.isArray(obj.coordinates))
        ) {
          const lat = obj.lat || obj.latitude || (obj.coordinates ? obj.coordinates[1] : null);
          const lng = obj.lng || obj.longitude || (obj.coordinates ? obj.coordinates[0] : null);
          
          if (lat && lng) {
            locs.push({
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              data: obj,
              path,
            });
          }
        }
        
        // Recursive search
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object') {
            locs.push(...extractLocations(value, newPath));
          }
        });
      }
      
      return locs;
    };

    setLocations(extractLocations(json));
  }, [json]);

  if (!json) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No JSON data available</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-2">No geographic data found</p>
          <p className="text-sm text-[var(--text-muted)]">
            Map view requires JSON with lat/lng, latitude/longitude, or coordinates fields
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[locations[0].lat, locations[0].lng]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.lng]}>
            <Popup>
              <div className="text-sm">
                <strong>Path:</strong> {location.path}<br />
                <strong>Lat:</strong> {location.lat}<br />
                <strong>Lng:</strong> {location.lng}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;