'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import all map-related components
const DynamicMapComponent = dynamic(() => import('./MapViewDynamic').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <p className="text-[var(--text-secondary)]">Loading map...</p>
    </div>
  )
});

interface MapViewProps {
  json: any;
}

const MapView: React.FC<MapViewProps> = ({ json }) => {
  return <DynamicMapComponent json={json} />;
};

export default MapView;