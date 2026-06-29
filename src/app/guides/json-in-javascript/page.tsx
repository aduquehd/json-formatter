import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Working with JSON in JavaScript: Parse, Stringify & Fetch',
  description:
    'A practical guide to working with JSON in JavaScript — parsing strings, stringifying values, fetching JSON from APIs, and storing it in localStorage.',
  keywords:
    'json in javascript, parse json javascript, json stringify, json.stringify, fetch json, json to object javascript, javascript json, stringify json',
  openGraph: {
    title: 'Working with JSON in JavaScript: Parse, Stringify & Fetch',
    description:
      'A practical guide to working with JSON in JavaScript — parsing strings, stringifying values, fetching JSON from APIs, and storing it in localStorage.',
    type: 'article',
    url: 'https://www.jsonformatter.me/guides/json-in-javascript',
  },
  alternates: {
    canonical: 'https://www.jsonformatter.me/guides/json-in-javascript',
  },
};

export default function JsonInJavaScriptPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Working with JSON in JavaScript: Parse, Stringify & Fetch',
    description:
      'A practical guide to working with JSON in JavaScript — parsing strings, stringifying values, fetching JSON from APIs, and storing it in localStorage.',
    author: {
      '@type': 'Person',
      name: 'Andres Duque',
    },
    publisher: {
      '@type': 'Organization',
      name: 'jsonformatter.me',
      url: 'https://www.jsonformatter.me',
    },
    datePublished: '2026-06-28',
    dateModified: new Date().toISOString().split('T')[0],
    mainEntityOfPage: 'https://www.jsonformatter.me/guides/json-in-javascript',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.jsonformatter.me/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://www.jsonformatter.me/guides',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'JSON in JavaScript',
        item: 'https://www.jsonformatter.me/guides/json-in-javascript',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-[var(--bg-primary)]">
        <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/" className="hover:text-[var(--accent-primary)]">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/guides" className="hover:text-[var(--accent-primary)]">
                  Guides
                </Link>
              </li>
              <li>/</li>
              <li className="text-[var(--text-primary)]">JSON in JavaScript</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Working with JSON in JavaScript
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              A practical cookbook for JavaScript developers — parse and stringify values, fetch
              JSON from an API, persist it in localStorage, and sidestep the gotchas.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <p className="text-[var(--text-secondary)] mb-4">
                JSON is the lingua franca of the web, and JavaScript gives you a tiny but powerful
                built-in <code className="text-[var(--accent-primary)]">JSON</code> object for
                working with it. This guide walks through the everyday tasks you will hit in real
                projects: turning strings into objects and back again, loading JSON over the
                network, saving it between page loads, formatting it for humans, iterating over it,
                and avoiding the surprises that bite even experienced developers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Parsing and stringifying
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                The two methods you will use most are{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse()</code>, which turns a
                JSON string into a JavaScript value, and{' '}
                <code className="text-[var(--accent-primary)]">JSON.stringify()</code>, which turns
                a JavaScript value back into a JSON string. They are exact mirror images of each
                other.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// String -> value
const user = JSON.parse('{"name":"Ada","age":36}');
user.name; // "Ada"

// Value -> string
const text = JSON.stringify({ name: 'Ada', age: 36 });
text; // '{"name":"Ada","age":36}'`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Parsing has more depth than it first appears — the reviver argument, error handling,
                and equivalents in other languages. For a full breakdown, read our{' '}
                <Link href="/guides/json-parse" className="text-[var(--accent-primary)] underline">
                  JSON.parse() guide
                </Link>
                .
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Fetching JSON from an API
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Most JSON you handle arrives over the network. The{' '}
                <code className="text-[var(--accent-primary)]">fetch()</code> API returns a response
                object, and calling <code className="text-[var(--accent-primary)]">res.json()</code>{' '}
                reads the body and parses it for you — no manual{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse()</code> needed.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`async function getUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);

  if (!res.ok) {
    throw new Error(\`Request failed: \${res.status}\`);
  }

  const user = await res.json();
  return user;
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Always check <code className="text-[var(--accent-primary)]">res.ok</code> before
                reading the body. <code className="text-[var(--accent-primary)]">fetch()</code> only
                rejects on network failures — a 404 or 500 still resolves successfully, so an error
                page can sneak through as if it were valid data.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Storing JSON in localStorage
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                <code className="text-[var(--accent-primary)]">localStorage</code> can only hold
                strings, so you stringify on the way in and parse on the way out. This pattern is
                perfect for caching settings, drafts, or small bits of state between visits.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// Save: value -> string
const settings = { theme: 'dark', fontSize: 14 };
localStorage.setItem('settings', JSON.stringify(settings));

// Read: string -> value
const saved = JSON.parse(localStorage.getItem('settings'));
saved.theme; // "dark"`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                If the key has never been set,{' '}
                <code className="text-[var(--accent-primary)]">getItem()</code> returns{' '}
                <code className="text-[var(--accent-primary)]">null</code>, and{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse(null)</code> happens to
                yield <code className="text-[var(--accent-primary)]">null</code> rather than
                throwing — but it is safer to guard for a missing value before parsing.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Pretty-printing JSON
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                By default <code className="text-[var(--accent-primary)]">JSON.stringify()</code>{' '}
                produces a single compact line. Pass a third argument — the indentation — to get
                readable, multi-line output for logs, files, or debugging.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const data = { name: 'Ada', roles: ['admin', 'editor'] };

JSON.stringify(data, null, 2);
// {
//   "name": "Ada",
//   "roles": [
//     "admin",
//     "editor"
//   ]
// }`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                The second argument is a replacer (often{' '}
                <code className="text-[var(--accent-primary)]">null</code>) and the third is the
                number of spaces per level. You can pass{' '}
                <code className="text-[var(--accent-primary)]">&apos;\t&apos;</code> instead of a
                number to indent with tabs.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Looping over JSON data
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Once a JSON string is parsed, it is just an ordinary object or array — so you
                iterate with the same tools you already use. For objects,{' '}
                <code className="text-[var(--accent-primary)]">Object.entries()</code> gives you
                key/value pairs:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const scores = JSON.parse('{"ada":91,"linus":88}');

for (const [name, score] of Object.entries(scores)) {
  console.log(\`\${name}: \${score}\`);
}
// ada: 91
// linus: 88`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                For arrays of records, <code className="text-[var(--accent-primary)]">map()</code>{' '}
                is the idiomatic way to transform each item:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const users = JSON.parse('[{"name":"Ada"},{"name":"Linus"}]');

const names = users.map((user) => user.name);
names; // ["Ada", "Linus"]`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Common gotchas</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                JSON is a subset of JavaScript, so some values survive the round trip and some
                quietly do not. Watch out for these:
              </p>
              <ul className="space-y-2 text-[var(--text-secondary)]">
                <li>
                  <strong className="text-[var(--text-primary)]">
                    undefined and functions disappear.
                  </strong>{' '}
                  <code className="text-[var(--accent-primary)]">JSON.stringify()</code> drops
                  object properties whose value is{' '}
                  <code className="text-[var(--accent-primary)]">undefined</code> or a function, and
                  turns them into <code className="text-[var(--accent-primary)]">null</code> inside
                  arrays.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Dates become strings.</strong> A{' '}
                  <code className="text-[var(--accent-primary)]">Date</code> is serialized to an ISO
                  string, and parsing it back gives you a string — not a{' '}
                  <code className="text-[var(--accent-primary)]">Date</code>. Use a reviver to
                  restore it.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Circular references throw.</strong>{' '}
                  If an object references itself (directly or through a chain),{' '}
                  <code className="text-[var(--accent-primary)]">JSON.stringify()</code> throws a{' '}
                  <code className="text-[var(--accent-primary)]">TypeError</code> about a circular
                  structure.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">
                    NaN and Infinity become null.
                  </strong>{' '}
                  These non-finite numbers cannot be represented in JSON, so they are stringified as{' '}
                  <code className="text-[var(--accent-primary)]">null</code>.
                </li>
              </ul>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Format and validate your JSON instantly
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Working with an API response or a localStorage blob? Paste it into our free
                formatter to pretty-print it, validate the structure, and catch errors before{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse()</code> ever throws.
              </p>
              <Link
                href="/"
                className="inline-block bg-[var(--accent-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Open JSON Formatter
              </Link>
            </section>
          </div>

          {/* Related Guides */}
          <nav className="mt-12 pt-8 border-t border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Related Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/guides/json-parse"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">JSON.parse() Explained</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Syntax, the reviver function, and error handling
                </p>
              </Link>
              <Link
                href="/guides/common-json-errors"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">Common JSON Errors</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Fix the mistakes that make JSON.parse() throw
                </p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
