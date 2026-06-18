import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';
import { viewSeo } from '@/lib/tools';

export const metadata: Metadata = viewSeo.map.metadata;

export default function Page() {
  return <ToolSeoContent view="map" />;
}
