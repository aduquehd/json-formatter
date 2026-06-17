import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileJson,
  GitCompare,
  Github,
  ListTree,
  Map,
  Network,
  Search,
  Shield,
  Wand2,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import HelpTabs, { type HelpTab } from '@/components/HelpTabs';

export const metadata: Metadata = {
  title: 'JSON Formatter Help & Guide - How to Format JSON Online',
  description:
    'Complete guide to our free JSON formatter, validator, and viewer. Learn the views, JSON syntax, common errors, keyboard shortcuts, and best practices.',
  keywords:
    'json help, json guide, how to format json, json tutorial, json syntax, json errors, json best practices, json validator help, json viewer guide',
  openGraph: {
    title: 'JSON Formatter Help & Complete Guide',
    description:
      'Learn how to format, validate, and explore JSON with our comprehensive guide — views, syntax, examples, and best practices.',
    type: 'article',
    url: 'https://www.jsonformatter.me/help',
  },
  alternates: { canonical: 'https://www.jsonformatter.me/help' },
};

const card = 'rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6';
const eyebrow = 'font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-color)]';
const h2 = 'text-2xl font-bold text-[var(--text-primary)]';
const h3 = 'font-semibold text-[var(--text-primary)]';
const body = 'text-sm leading-relaxed text-[var(--text-secondary)]';
const kbd =
  'rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)]';
const codeChip =
  'rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--accent-color)]';

const VIEWS = [
  {
    icon: FileJson,
    name: 'JSON Editor',
    desc: 'A real code editor with syntax highlighting, line numbers, folding and bracket matching. Paste anything — invalid JSON is auto-fixed on format.',
  },
  {
    icon: ListTree,
    name: 'Tree View',
    desc: 'Explore JSON as a collapsible tree. Expand/collapse nodes and edit any key or value inline by clicking it.',
  },
  {
    icon: Network,
    name: 'Graph View',
    desc: 'A hierarchical node graph of your data. Click nodes to expand or collapse branches; zoom, pan, and fit to screen.',
  },
  {
    icon: BarChart3,
    name: 'Statistics',
    desc: 'An analytics dashboard: total keys, values, depth, minified size, type distribution, nesting depth and most-frequent keys.',
  },
  {
    icon: GitCompare,
    name: 'Diff View',
    desc: 'Compare two JSON documents side by side. Differences update automatically with a git-style added / removed / modified breakdown.',
  },
  {
    icon: Search,
    name: 'Search & Filter',
    desc: 'Search keys and values across the whole document, filter by type, and surface quick insights about your data.',
  },
  {
    icon: Map,
    name: 'Map View',
    desc: 'Plot geographic data on an interactive map — GeoJSON, lat/lng pairs, or coordinate arrays are detected automatically.',
  },
];

const WHY = [
  {
    icon: Zap,
    title: 'Instant formatting',
    desc: 'Beautify minified or messy JSON in one click with clean, consistent indentation.',
  },
  {
    icon: CheckCircle2,
    title: 'Real-time validation',
    desc: 'Catch syntax errors instantly with clear, located messages while you type.',
  },
  {
    icon: Wand2,
    title: 'Smart auto-fix',
    desc: 'Trailing commas, single quotes and unquoted keys are repaired automatically.',
  },
  {
    icon: Shield,
    title: '100% private',
    desc: 'Everything runs in your browser. No servers, no tracking, no data ever leaves your machine.',
  },
];

const RULES = [
  ['Keys are double-quoted strings', '{ "name": "Ada" }'],
  ['Strings use double quotes (never single)', '"hello"'],
  ['No trailing commas', '[1, 2, 3]'],
  ['Values: string, number, boolean, null, object, array', 'true · 42 · null'],
  ['No comments are allowed in strict JSON', '—'],
];

const ERRORS = [
  ['Single quotes', `{ 'a': 1 }`, `{ "a": 1 }`],
  ['Unquoted keys', `{ a: 1 }`, `{ "a": 1 }`],
  ['Trailing comma', `[1, 2, ]`, `[1, 2]`],
  ['Python literals', `{ "ok": True }`, `{ "ok": true }`],
];

const FAQ = [
  [
    'What is a JSON formatter?',
    'A tool that takes raw or minified JSON and re-indents it with line breaks so it is easy to read. Ours adds 2/4-space or tab indentation, organizes nested structures, and syntax-highlights the result.',
  ],
  [
    'What is JSON?',
    'JSON (JavaScript Object Notation) is a lightweight, language-independent data-interchange format that is easy for humans to read and for machines to parse.',
  ],
  ['Is it free?', 'Yes — completely free and open source, with no signup, no ads, and no limits.'],
  [
    'Is my data secure?',
    'Absolutely. All processing happens 100% locally in your browser; nothing is ever uploaded, so it is safe for confidential data.',
  ],
  [
    'Can it fix invalid JSON?',
    'Yes. The smart fixer repairs common mistakes — trailing commas, single quotes, unquoted keys and Python-style literals — when you format.',
  ],
  [
    'Can I validate JSON?',
    'Validation runs as you type. The status bar shows valid/invalid plus node count, depth and size at a glance.',
  ],
  [
    'What can I do beyond formatting?',
    'Explore data in Tree and Graph views, analyze it in Statistics, compare two documents in Diff, search and filter, and plot geographic data on a map.',
  ],
];

export default function HelpPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://www.jsonformatter.me/help#faq',
    mainEntity: FAQ.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'JSON Formatter',
        item: 'https://www.jsonformatter.me',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Help & Guide',
        item: 'https://www.jsonformatter.me/help',
      },
    ],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Format JSON Online',
    description:
      'Step-by-step guide to format, validate, and explore JSON with our free online tool.',
    totalTime: 'PT1M',
    tool: [{ '@type': 'HowToTool', name: 'JSON Formatter & Viewer' }],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Paste JSON',
        text: 'Paste your JSON into the editor — valid or not.',
      },
      {
        '@type': 'HowToStep',
        name: 'Format',
        text: 'Click Format (or press Cmd/Ctrl+Enter) to beautify and validate.',
      },
      {
        '@type': 'HowToStep',
        name: 'Explore',
        text: 'Switch views — Tree, Graph, Statistics, Diff, Search, Map.',
      },
      {
        '@type': 'HowToStep',
        name: 'Copy or Download',
        text: 'Copy the result or download it as a .json file.',
      },
    ],
  };

  const tabs: HelpTab[] = [
    {
      id: 'start',
      label: 'Getting Started',
      content: (
        <div className="space-y-10">
          <section>
            <p className={eyebrow}>// quick start</p>
            <h2 className={`${h2} mt-1 mb-6`}>Format JSON in four steps</h2>
            <ol className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  'Paste your JSON',
                  'Drop raw, minified or even slightly broken JSON into the editor — or use Open / Paste.',
                ],
                [
                  'Format',
                  'Click Format (or press Cmd/Ctrl + Enter). Invalid JSON is auto-fixed where possible.',
                ],
                [
                  'Explore',
                  'Switch tabs to view your data as a tree, graph, stats dashboard, diff, search or map.',
                ],
                [
                  'Copy or download',
                  'Copy to the clipboard or download a .json file with Cmd/Ctrl + S.',
                ],
              ].map(([title, desc], i) => (
                <li key={title} className={`${card} flex gap-4`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent-bg)] font-mono font-bold text-[var(--accent-color)]">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className={`${h3} mb-1`}>{title}</h3>
                    <p className={body}>{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <p className={eyebrow}>// shortcuts</p>
            <h2 className={`${h2} mt-1 mb-4`}>Keyboard shortcuts</h2>
            <div className={`${card} divide-y divide-[var(--border-color)] p-0`}>
              {[
                ['Format JSON', ['⌘', '/', 'Ctrl', '+', '↵']],
                ['Download .json', ['⌘', '/', 'Ctrl', '+', 'S']],
              ].map(([label, keys]) => (
                <div key={label as string} className="flex items-center justify-between px-5 py-3">
                  <span className={body}>{label as string}</span>
                  <span className="flex items-center gap-1">
                    {(keys as string[]).map((k, i) =>
                      k === '/' || k === '+' ? (
                        <span key={i} className="px-0.5 text-xs text-[var(--text-muted)]">
                          {k}
                        </span>
                      ) : (
                        <kbd key={i} className={kbd}>
                          {k}
                        </kbd>
                      )
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className={eyebrow}>// why use it</p>
            <h2 className={`${h2} mt-1 mb-6`}>Built for developers</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {WHY.map(({ icon: Icon, title, desc }) => (
                <div key={title} className={`${card} flex gap-4`}>
                  <Icon className="h-5 w-5 shrink-0 text-[var(--accent-color)]" />
                  <div>
                    <h3 className={`${h3} mb-1`}>{title}</h3>
                    <p className={body}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: 'views',
      label: 'Views & Features',
      content: (
        <section>
          <p className={eyebrow}>// the workspace</p>
          <h2 className={`${h2} mt-1 mb-6`}>Seven ways to work with JSON</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VIEWS.map(({ icon: Icon, name, desc }) => (
              <article
                key={name}
                className={`${card} transition-colors hover:border-[var(--accent-color)]`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--accent-bg)]">
                    <Icon className="h-5 w-5 text-[var(--accent-color)]" />
                  </span>
                  <h3 className={`${h3} text-base`}>{name}</h3>
                </div>
                <p className={body}>{desc}</p>
              </article>
            ))}
          </div>
        </section>
      ),
    },
    {
      id: 'guide',
      label: 'JSON Guide',
      content: (
        <div className="space-y-10">
          <section>
            <p className={eyebrow}>// valid json</p>
            <h2 className={`${h2} mt-1 mb-2`}>Valid JSON rules</h2>
            <p className={`${body} mb-5 max-w-2xl`}>
              JSON is strict. Most &ldquo;broken&rdquo; JSON comes from JavaScript or Python habits.
              These are the rules — and our formatter fixes the common slips automatically.
            </p>
            <ul className={`${card} divide-y divide-[var(--border-color)] p-0`}>
              {RULES.map(([rule, ex]) => (
                <li key={rule} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className={`${body} text-[var(--text-primary)]`}>{rule}</span>
                  <code className={codeChip}>{ex}</code>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className={eyebrow}>// auto-fix</p>
            <h2 className={`${h2} mt-1 mb-5`}>Common errors we fix</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ERRORS.map(([label, bad, good]) => (
                <div key={label} className={card}>
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[var(--accent-warning)]" />
                    <h3 className={`${h3} text-sm`}>{label}</h3>
                  </div>
                  <div className="space-y-2 font-mono text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent-error)]">✗</span>
                      <code className="text-[var(--text-secondary)] line-through decoration-[var(--accent-error)]/50">
                        {bad}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--accent-success)]">✓</span>
                      <code className="text-[var(--text-primary)]">{good}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: 'faq',
      label: 'FAQ',
      content: (
        <section>
          <p className={eyebrow}>// questions</p>
          <h2 className={`${h2} mt-1 mb-6`}>Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className={`${card} group p-5`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[var(--text-primary)]">
                  {q}
                  <span className="text-[var(--text-muted)] transition-transform group-open:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className={`${body} mt-3`}>{a}</p>
              </details>
            ))}
          </div>
        </section>
      ),
    },
    {
      id: 'tools',
      label: 'More Tools',
      content: (
        <div className="space-y-10">
          <section>
            <p className={eyebrow}>// more json tools</p>
            <h2 className={`${h2} mt-1 mb-6`}>Dedicated tool pages</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['JSON Formatter', '/tools/json-formatter'],
                ['JSON Viewer', '/tools/json-viewer'],
                ['JSON Validator', '/tools/json-validator'],
                ['JSON Beautifier', '/tools/json-beautifier'],
                ['JSON Editor', '/tools/json-editor'],
                ['JSON Parser', '/tools/json-parser'],
              ].map(([name, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-center font-mono text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
                >
                  {name}
                </Link>
              ))}
            </div>
          </section>

          <section className={`${card} text-center`}>
            <Shield className="mx-auto mb-3 h-6 w-6 text-[var(--accent-color)]" />
            <h2 className={`${h2} mb-3`}>Private &amp; open source</h2>
            <p className={`${body} mx-auto mb-4 max-w-2xl`}>
              A free, open-source tool for developers. Format, validate, and explore JSON instantly
              — every byte is processed locally in your browser, so your data never leaves your
              computer.
            </p>
            <a
              href="https://github.com/aduquehd/json-viewer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
            >
              <Github className="h-4 w-4" />
              View source on GitHub
            </a>
          </section>
        </div>
      ),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="min-h-screen">
        <nav className="sticky top-0 z-30 border-b border-[var(--navbar-border)] bg-[var(--navbar-bg)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-color)]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to the formatter
            </Link>
            <nav aria-label="Breadcrumb" className="font-mono text-xs text-[var(--text-muted)]">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-[var(--text-secondary)]">
                    home
                  </Link>
                </li>
                <li>/</li>
                <li className="text-[var(--text-secondary)]">help</li>
              </ol>
            </nav>
          </div>
        </nav>

        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-10">
            <p className={`${eyebrow} mb-2 flex items-center gap-2`}>
              <span className="font-mono text-base text-[var(--accent-color)]">{'{ }'}</span> docs
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
              JSON Formatter — Help &amp; Guide
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-[var(--text-secondary)]">
              Everything about formatting, validating, and exploring JSON — the views, the syntax,
              the shortcuts, and the answers to common questions.
            </p>
          </header>

          <HelpTabs tabs={tabs} />
        </main>
      </div>
    </>
  );
}
