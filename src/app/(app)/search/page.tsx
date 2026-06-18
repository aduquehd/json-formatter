import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';
import { viewSeo } from '@/lib/tools';

export const metadata: Metadata = viewSeo.search.metadata;

export default function Page() {
  return <ToolSeoContent view="search" />;
}
