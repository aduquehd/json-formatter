import type { Metadata } from 'next';

/**
 * The views the JSON workbench can open into. Each maps to a clean URL, so the
 * active view is reflected in the address bar and every view is a real,
 * reloadable, indexable page. Kept in sync with the tab ids in `TabsContainer`.
 */
export type ToolView = 'formatted' | 'tree' | 'graph' | 'stats' | 'diff' | 'search' | 'map';

const SITE = 'https://www.jsonformatter.me';

export interface ViewSeo {
  view: ToolView;
  /** Clean path this view lives at (e.g. '/', '/tree', '/diff'). */
  path: string;
  /** Visible-to-crawlers heading (rendered as the page's single h1). */
  heading: string;
  /** Short "About" paragraph shown in the collapsible SEO section. */
  intro: string;
  metadata: Metadata;
  faqs: { question: string; answer: string }[];
  /** Feature bullets, surfaced in the WebApplication JSON-LD. */
  features: string[];
  /** Numbered usage steps — rendered visibly and as HowTo JSON-LD. */
  howTo: string[];
  /** Internal cross-links to related views/guides for crawl depth + UX. */
  related: { href: string; title: string; description: string }[];
}

function meta(path: string, title: string, description: string, keywords: string): Metadata {
  const url = `${SITE}${path === '/' ? '/' : path}`;
  return {
    // Absolute so the layout's "%s | JSON Formatter" template isn't appended.
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'jsonformatter.me',
      images: [{ url: '/img/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/img/og-image.png'],
    },
  };
}

export const viewSeo: Record<ToolView, ViewSeo> = {
  formatted: {
    view: 'formatted',
    path: '/',
    heading: 'JSON Formatter & Validator',
    intro:
      'Format, validate, and beautify JSON right in your browser. Paste messy or minified JSON and get clean, properly indented output with syntax highlighting — plus automatic fixing of common errors like trailing commas and single quotes. Everything runs locally, so your data never leaves your device.',
    metadata: meta(
      '/',
      'JSON Formatter & Validator – Format, Validate & Beautify JSON Online',
      'Free online JSON formatter, validator and beautifier. Format, validate, beautify and minify JSON instantly in your browser — with auto-fix, tree view, and more. 100% private.',
      'json formatter, json validator, json beautifier, format json, validate json, beautify json, json editor, json parser, json lint, json online'
    ),
    faqs: [
      {
        question: 'How do I format JSON?',
        answer:
          'Paste your JSON into the editor and click Format (or press Ctrl/Cmd+Enter). It is reindented with 2-space indentation and syntax highlighting. You can switch to 4 spaces or tabs and sort keys from the toolbar.',
      },
      {
        question: 'Can it fix invalid JSON?',
        answer:
          'Yes. The built-in auto-fix corrects common mistakes — trailing commas, single quotes, unquoted keys, and missing commas — and tells you what it changed.',
      },
      {
        question: 'Is my JSON sent to a server?',
        answer:
          'No. All formatting and validation happen entirely in your browser. Nothing is uploaded, so it is safe for sensitive or proprietary data.',
      },
    ],
    features: [
      'One-click formatting and beautifying',
      'Real-time JSON validation',
      'Automatic error fixing',
      'Minify / compact JSON',
      'Tree, graph, diff, and stats views',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste or type your JSON into the editor — or drag in a .json file. Minified, messy, or invalid JSON all work.',
      'Click Format (or press Ctrl/Cmd+Enter) to reindent and validate it. Trailing commas, single quotes, and other common errors are fixed automatically.',
      'Copy the clean output, minify it, or switch to the Tree, Graph, or Diff views to explore your data further.',
    ],
    related: [
      {
        href: '/tree',
        title: 'JSON Tree Viewer',
        description: 'Explore JSON as an interactive, collapsible tree.',
      },
      {
        href: '/diff',
        title: 'JSON Diff',
        description: 'Compare two JSON documents and find every difference.',
      },
      {
        href: '/guides/common-json-errors',
        title: 'Common JSON Errors',
        description: 'Fix the most frequent JSON mistakes.',
      },
    ],
  },
  tree: {
    view: 'tree',
    path: '/tree',
    heading: 'JSON Tree Viewer',
    intro:
      'Explore JSON as an interactive, collapsible tree. Expand and collapse nodes to navigate deeply nested data, edit values in place, and see the path to any node — far easier than scrolling through raw text.',
    metadata: meta(
      '/tree',
      'JSON Viewer – Explore JSON in an Interactive Tree View',
      'Free online JSON viewer. Explore JSON in a collapsible, interactive tree — expand nodes, edit inline, and navigate large documents. Runs 100% in your browser.',
      'json viewer, json tree view, view json, json explorer, json tree, online json viewer'
    ),
    faqs: [
      {
        question: 'What is a JSON tree viewer?',
        answer:
          'It displays JSON as a hierarchy of expandable nodes instead of raw text, so you can drill into nested objects and arrays by clicking rather than scrolling.',
      },
      {
        question: 'Can I edit values in the tree?',
        answer:
          'Yes — click a value to edit it inline, and the change is reflected back in the underlying JSON.',
      },
      {
        question: 'Is there a limit on file size?',
        answer:
          'There is no hard limit. The tree view is optimized for large documents and runs entirely in your browser.',
      },
    ],
    features: [
      'Interactive collapsible tree',
      'Inline value editing',
      'Node path display',
      'Search and filter',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste your JSON into the editor at the top of the page.',
      'The tree renders automatically — click any node to expand or collapse nested objects and arrays.',
      'Click a value to edit it inline, or use search to jump straight to the key you need.',
    ],
    related: [
      { href: '/', title: 'JSON Formatter', description: 'Format, validate, and beautify JSON.' },
      {
        href: '/graph',
        title: 'JSON Graph Viewer',
        description: 'Visualize JSON as an interactive node-link graph.',
      },
      {
        href: '/stats',
        title: 'JSON Analyzer',
        description: 'Key counts, nesting depth, and data-type breakdown.',
      },
    ],
  },
  graph: {
    view: 'graph',
    path: '/graph',
    heading: 'JSON Graph Viewer',
    intro:
      'Visualize JSON as an interactive node-link graph. See how objects and arrays connect, pan and zoom around large structures, and understand relationships that are hard to spot in raw text.',
    metadata: meta(
      '/graph',
      'JSON Graph Viewer – Visualize JSON as an Interactive Graph',
      'Free online JSON graph visualizer. See your JSON as an interactive node-link graph to understand its structure and relationships. 100% client-side.',
      'json graph, json visualizer, visualize json, json graph viewer, json diagram, json visualization'
    ),
    faqs: [
      {
        question: 'What does the graph view show?',
        answer:
          'It renders your JSON as a network of connected nodes, making nesting and the relationships between parts of your data easy to see at a glance.',
      },
      {
        question: 'Is it good for large JSON?',
        answer:
          'Yes — you can pan and zoom to navigate large graphs, and everything renders locally in your browser.',
      },
    ],
    features: [
      'Interactive node-link graph',
      'Pan and zoom navigation',
      'Relationship visualization',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste your JSON into the editor.',
      'Switch to the Graph view to see your data rendered as a network of connected nodes.',
      'Pan and zoom to navigate large structures and trace relationships between objects and arrays.',
    ],
    related: [
      {
        href: '/tree',
        title: 'JSON Tree Viewer',
        description: 'Explore JSON as a collapsible tree.',
      },
      { href: '/stats', title: 'JSON Analyzer', description: 'Understand the shape of your JSON.' },
      { href: '/', title: 'JSON Formatter', description: 'Format and validate JSON first.' },
    ],
  },
  stats: {
    view: 'stats',
    path: '/stats',
    heading: 'JSON Analyzer',
    intro:
      'Get instant statistics about your JSON: total keys, maximum nesting depth, and counts of every data type — strings, numbers, booleans, nulls, arrays, and objects. A fast way to understand the shape of an unfamiliar document.',
    metadata: meta(
      '/stats',
      'JSON Analyzer – Statistics, Structure & Data Types',
      'Free online JSON analyzer. Get instant statistics on your JSON — key counts, nesting depth, and a data-type breakdown. Understand any JSON document fast.',
      'json analyzer, json statistics, analyze json, json structure, json stats, json data types'
    ),
    faqs: [
      {
        question: 'What statistics does it show?',
        answer:
          'Total key count, maximum nesting depth, array lengths, and a breakdown of how many values of each type your JSON contains.',
      },
      {
        question: 'Why analyze JSON structure?',
        answer:
          'It helps you understand large or unfamiliar API responses and data before writing code against them.',
      },
    ],
    features: [
      'Key and depth counts',
      'Data-type breakdown',
      'Structure insights',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste your JSON into the editor.',
      'Open the Analyzer view to see key counts, maximum nesting depth, and a breakdown of every data type.',
      'Use the insights to understand an unfamiliar API response before writing code against it.',
    ],
    related: [
      {
        href: '/tree',
        title: 'JSON Tree Viewer',
        description: 'Drill into the structure node by node.',
      },
      { href: '/graph', title: 'JSON Graph Viewer', description: 'See relationships visually.' },
      { href: '/', title: 'JSON Formatter', description: 'Format and validate JSON.' },
    ],
  },
  diff: {
    view: 'diff',
    path: '/diff',
    heading: 'JSON Diff',
    intro:
      'Compare two JSON documents and spot every difference. Paste an original and a modified version to see added, removed, and changed values highlighted — in side-by-side, unified, or semantic mode, with the option to ignore key order so reordered objects do not show as false differences.',
    metadata: meta(
      '/diff',
      'JSON Diff – Compare Two JSON Files & Find Differences Online',
      'Free online JSON diff tool. Compare two JSON documents side by side and find every difference instantly — split, unified, and semantic views. 100% private.',
      'json diff, compare json, json comparison, json difference checker, compare two json files, diff json online, json compare tool'
    ),
    faqs: [
      {
        question: 'How do I compare two JSON files?',
        answer:
          'Paste the original JSON in the left panel and the modified JSON in the right; the diff updates automatically and highlights every added, removed, and changed value.',
      },
      {
        question: 'What are the split, unified, and semantic modes?',
        answer:
          'Split shows both documents side by side; unified is a single git-style diff with + and - markers; semantic lists exactly which fields changed, ignoring formatting.',
      },
      {
        question: 'Can it ignore the order of object keys?',
        answer:
          'Yes — enable "Ignore key order" so reordered keys are treated as equal and not reported as differences.',
      },
    ],
    features: [
      'Side-by-side, unified, and semantic diff',
      'Ignore key order',
      'Collapse unchanged sections',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste the original JSON in the left panel.',
      'Paste the modified JSON in the right panel — the diff updates automatically.',
      "Switch between split, unified, and semantic modes, and enable 'Ignore key order' so reordered keys aren't flagged.",
    ],
    related: [
      { href: '/', title: 'JSON Formatter', description: 'Format both files before comparing.' },
      { href: '/tree', title: 'JSON Tree Viewer', description: 'Explore each document as a tree.' },
    ],
  },
  search: {
    view: 'search',
    path: '/search',
    heading: 'JSON Search & Filter',
    intro:
      'Search and filter large JSON documents to quickly find the keys or values you need, then jump straight to them — entirely in your browser.',
    metadata: meta(
      '/search',
      'JSON Search – Search & Filter JSON Online',
      'Free online JSON search and filter tool. Quickly find keys and values in large JSON documents, right in your browser.',
      'json search, search json, filter json, find in json, json query'
    ),
    faqs: [
      {
        question: 'How does JSON search work?',
        answer:
          'Type a query to find matching keys or values across your JSON; matches are highlighted so you can locate data in large documents fast.',
      },
    ],
    features: [
      'Search keys and values',
      'Filter large documents',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste your JSON into the editor.',
      'Type a query to find matching keys or values anywhere in the document.',
      'Jump to any match — handy for navigating large API responses.',
    ],
    related: [
      {
        href: '/tree',
        title: 'JSON Tree Viewer',
        description: 'Browse the full structure as a tree.',
      },
      { href: '/', title: 'JSON Formatter', description: 'Format and validate JSON.' },
    ],
  },
  map: {
    view: 'map',
    path: '/map',
    heading: 'JSON Map Viewer',
    intro:
      'Plot JSON that contains geographic coordinates on an interactive map. Paste data with latitude/longitude fields and see the points rendered instantly.',
    metadata: meta(
      '/map',
      'JSON Map Viewer – Plot JSON Coordinates on a Map',
      'Free online JSON map viewer. Plot JSON latitude/longitude data on an interactive map instantly, in your browser.',
      'json map, json geojson viewer, plot json on map, json coordinates map'
    ),
    faqs: [
      {
        question: 'What JSON can the map view plot?',
        answer:
          'Any JSON containing latitude/longitude coordinates; the points are plotted on an interactive map rendered in your browser.',
      },
    ],
    features: [
      'Plot coordinates on a map',
      'Interactive pan and zoom',
      'No data sent to servers — 100% client-side',
    ],
    howTo: [
      'Paste JSON containing latitude/longitude fields into the editor.',
      'Open the Map view to see every coordinate plotted on an interactive map.',
      'Pan and zoom to inspect the points — everything renders locally in your browser.',
    ],
    related: [
      { href: '/tree', title: 'JSON Tree Viewer', description: 'Inspect the raw coordinate data.' },
      { href: '/', title: 'JSON Formatter', description: 'Validate your GeoJSON first.' },
    ],
  },
};

/** All views, in tab order — used by the sitemap. */
export const seoViews = Object.values(viewSeo);

/** Reverse lookup: clean path → view id (for the URL-driven workbench). */
export const pathToView: Record<string, ToolView> = Object.fromEntries(
  seoViews.map((v) => [v.path, v.view])
);

export function viewToPath(view: ToolView): string {
  return viewSeo[view].path;
}
