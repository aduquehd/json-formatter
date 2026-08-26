'use client';

import dynamic from 'next/dynamic';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Dynamically import all map-related components
const DynamicMapComponent = dynamic(
  () => import('./MapViewDynamic').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">
          {typeof window !== 'undefined' && window.i18n
            ? window.i18n.t('map.loading')
            : 'Loading map...'}
        </p>
      </div>
    ),
  }
);

interface MapViewProps {
  json: any;
  isValid?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ json, isValid }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <DynamicMapComponent json={json} isValid={isValid} />;
};

export default MapView;
