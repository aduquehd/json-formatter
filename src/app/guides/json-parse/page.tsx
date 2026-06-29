import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'JSON.parse() Explained: Syntax, Examples & Common Errors',
  description:
    'What does JSON.parse() do? A complete guide to parsing JSON in JavaScript — syntax, examples, the reviver function, error handling, and how decoding works in Python and PHP.',
  keywords:
    'json.parse, what does json.parse do, json parse, parse json, json decode, json object parse, json.parse example, json.parse vs json.stringify, parse json javascript',
  openGraph: {
    title: 'JSON.parse() Explained: Syntax, Examples & Common Errors',
    description:
      'A complete guide to parsing JSON in JavaScript — syntax, examples, the reviver function, and error handling.',
    type: 'article',
    url: 'https://www.jsonformatter.me/guides/json-parse',
  },
  alternates: {
    canonical: 'https://www.jsonformatter.me/guides/json-parse',
  },
};

export default function JsonParsePage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'JSON.parse() Explained: Syntax, Examples & Common Errors',
    description:
      'A complete guide to parsing JSON in JavaScript — syntax, examples, the reviver function, and error handling.',
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
    mainEntityOfPage: 'https://www.jsonformatter.me/guides/json-parse',
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
        name: 'JSON.parse() Explained',
        item: 'https://www.jsonformatter.me/guides/json-parse',
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
              <li className="text-[var(--text-primary)]">JSON.parse() Explained</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              JSON.parse() Explained
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              What JSON.parse() does, how to use it, and how to handle the errors it throws — with
              practical examples in JavaScript, Python, and PHP.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                What does JSON.parse() do?
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                <strong className="text-[var(--text-primary)]">JSON.parse()</strong> takes a JSON
                string and converts it into a real JavaScript value — an object, array, number,
                string, boolean, or <code className="text-[var(--accent-primary)]">null</code>. It
                is the opposite of{' '}
                <code className="text-[var(--accent-primary)]">JSON.stringify()</code>, which turns
                a JavaScript value back into a JSON string.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                You reach for it whenever data arrives as text — a response from an API, a value
                read from <code className="text-[var(--accent-primary)]">localStorage</code>, or the
                contents of a <code className="text-[var(--accent-primary)]">.json</code> file —
                because you cannot access properties on a string. Parsing turns that text into a
                structure you can actually work with.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Syntax</h2>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`JSON.parse(text)
JSON.parse(text, reviver)`}</code>
              </pre>
              <ul className="space-y-2 text-[var(--text-secondary)] mt-4">
                <li>
                  <strong className="text-[var(--text-primary)]">text</strong> — the JSON string to
                  parse.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">reviver</strong> (optional) — a
                  function that transforms each value as it is parsed.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Basic example</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Pass a JSON string and get back an object you can read from:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const text = '{"name":"Ada","age":36,"admin":true}';
const user = JSON.parse(text);

console.log(user.name);  // "Ada"
console.log(user.age);   // 36
typeof user;             // "object"`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Arrays and nested structures work the same way:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const data = JSON.parse('[1, 2, {"ok": true}]');
data[2].ok;  // true`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                The reviver function
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                The optional second argument lets you transform values during parsing. A common use
                is converting date strings back into{' '}
                <code className="text-[var(--accent-primary)]">Date</code> objects:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const text = '{"event":"launch","date":"2026-06-28T10:00:00Z"}';

const obj = JSON.parse(text, (key, value) => {
  if (key === 'date') return new Date(value);
  return value;
});

obj.date instanceof Date;  // true`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                JSON.parse() vs JSON.stringify()
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                They are mirror images of each other — one decodes, the other encodes:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">JSON.parse()</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    String → JavaScript value (decode)
                  </p>
                  <code className="text-sm text-[var(--accent-primary)]">
                    {'JSON.parse(\'{"a":1}\')'}
                  </code>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                    JSON.stringify()
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    JavaScript value → String (encode)
                  </p>
                  <code className="text-sm text-[var(--accent-primary)]">
                    {'JSON.stringify({ a: 1 })'}
                  </code>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Handling errors
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                If the string is not valid JSON, JSON.parse() throws a{' '}
                <code className="text-[var(--accent-primary)]">SyntaxError</code>. Always wrap it in
                a <code className="text-[var(--accent-primary)]">try...catch</code> when the input
                might be malformed:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Invalid JSON:', err.message);
    return null;
  }
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                The most frequent message is{' '}
                <code className="text-[var(--accent-primary)]">Unexpected token ... in JSON</code>,
                usually caused by trailing commas, single quotes, unquoted keys, or an empty string.
                Our{' '}
                <Link
                  href="/guides/common-json-errors"
                  className="text-[var(--accent-primary)] underline"
                >
                  common JSON errors guide
                </Link>{' '}
                covers each one and how to fix it.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Decoding JSON in other languages
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Every major language has an equivalent of JSON.parse() for decoding a JSON string:
              </p>
              <div className="space-y-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Python</h3>
                  <pre className="overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">{`import json
data = json.loads('{"name": "Ada"}')
data["name"]  # "Ada"`}</code>
                  </pre>
                </div>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">PHP</h3>
                  <pre className="overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">{`$data = json_decode('{"name": "Ada"}', true);
echo $data["name"]; // Ada`}</code>
                  </pre>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Frequently asked questions
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    What does JSON.parse() return?
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    Whatever the JSON describes — an object, array, number, string, boolean, or
                    null. It never returns the original string.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Does JSON.parse() modify the original string?
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    No. Strings are immutable in JavaScript; JSON.parse() reads the string and
                    returns a brand-new value.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    Why does JSON.parse() fail on a JavaScript object?
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    JSON.parse() expects a string. If you pass an object, JavaScript first converts
                    it with toString() to{' '}
                    <code className="text-[var(--accent-primary)]">[object Object]</code>, which is
                    not valid JSON and throws. Only call it on strings.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Test your JSON before you parse it
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Paste your JSON into our free formatter to validate it, spot the exact error, and
                auto-fix common mistakes — so JSON.parse() never trips on it.
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
                href="/guides/common-json-errors"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">Common JSON Errors</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Fix the mistakes that make JSON.parse() throw
                </p>
              </Link>
              <Link
                href="/guides/json-syntax"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">JSON Syntax Guide</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  The rules valid JSON must follow
                </p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
