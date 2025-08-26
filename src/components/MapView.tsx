'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';

// Dynamically import all map-related components
const DynamicMapComponent = dynamic(() => import('./MapViewDynamic').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <p className="text-[var(--text-secondary)]">{typeof window !== 'undefined' && window.i18n ? window.i18n.t('map.loading') : 'Loading map...'}</p>
    </div>
  )
});

interface MapViewProps {
  json: any;
}

const MapView: React.FC<MapViewProps> = ({ json }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <DynamicMapComponent json={json} />;
};

export default MapView;