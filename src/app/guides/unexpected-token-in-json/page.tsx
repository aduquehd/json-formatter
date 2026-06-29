import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "How to Fix 'Unexpected token in JSON' Errors",
  description:
    "Diagnose and fix the common JSON.parse SyntaxError, including the 'unexpected token o in JSON' and 'unexpected end of JSON input' cases, with clear before-and-after code examples.",
  keywords:
    'unexpected token in json, unexpected token o in json, unexpected end of json input, json parse error, syntaxerror unexpected token json, json unexpected token',
  openGraph: {
    title: "How to Fix 'Unexpected token in JSON' Errors",
    description:
      "Diagnose and fix the common JSON.parse SyntaxError, including the 'unexpected token o in JSON' and 'unexpected end of JSON input' cases.",
    type: 'article',
    url: 'https://www.jsonformatter.me/guides/unexpected-token-in-json',
  },
  alternates: {
    canonical: 'https://www.jsonformatter.me/guides/unexpected-token-in-json',
  },
};

export default function UnexpectedTokenInJsonPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: "How to Fix 'Unexpected token in JSON' Errors",
    description:
      "Diagnose and fix the common JSON.parse SyntaxError, including the 'unexpected token o in JSON' and 'unexpected end of JSON input' cases.",
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
    mainEntityOfPage: 'https://www.jsonformatter.me/guides/unexpected-token-in-json',
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
        name: 'Unexpected token in JSON',
        item: 'https://www.jsonformatter.me/guides/unexpected-token-in-json',
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
              <li className="text-[var(--text-primary)]">Unexpected token in JSON</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
              How to Fix &quot;Unexpected token in JSON&quot; Errors
            </h1>
            <p className="text-xl text-[var(--text-secondary)]">
              A practical guide to diagnosing and fixing the JavaScript SyntaxError family — from
              &quot;unexpected token o&quot; to &quot;unexpected end of JSON input&quot; — with
              before-and-after code you can copy.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                What the error actually means
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Every &quot;Unexpected token ... in JSON&quot; message is a{' '}
                <code className="text-[var(--accent-primary)]">SyntaxError</code> thrown by{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse()</code>. It means the
                string you handed to the parser is{' '}
                <strong className="text-[var(--text-primary)]">not valid JSON</strong>. The parser
                reads the text character by character, and the moment it hits something it cannot
                make sense of, it stops and reports that character.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                The message usually points to the exact spot — for example{' '}
                <code className="text-[var(--accent-primary)]">
                  Unexpected token o in JSON at position 1
                </code>{' '}
                or{' '}
                <code className="text-[var(--accent-primary)]">Unexpected end of JSON input</code>.
                The token it names and the position it gives are your two biggest clues. Read them
                literally: they tell you which character broke parsing and where it sits in the
                string.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                &quot;Unexpected token o in JSON at position 1&quot;
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                This is the most common one, and it is almost always a sign you passed an{' '}
                <strong className="text-[var(--text-primary)]">object or array</strong> to{' '}
                <code className="text-[var(--accent-primary)]">JSON.parse()</code> instead of a
                string. JSON.parse() expects text, so JavaScript first coerces your object to a
                string, producing{' '}
                <code className="text-[var(--accent-primary)]">[object Object]</code>. The parser
                reads the first character <code className="text-[var(--accent-primary)]">[</code>,
                then hits <code className="text-[var(--accent-primary)]">o</code> at position 1 —
                hence the &quot;token o&quot;.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// Wrong — data is already an object
const data = { name: 'Ada' };
JSON.parse(data); // SyntaxError: Unexpected token o in JSON at position 1

// Right — only parse actual JSON strings
const text = '{"name":"Ada"}';
const obj = JSON.parse(text); // { name: 'Ada' }`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                The classic version of this happens with{' '}
                <code className="text-[var(--accent-primary)]">fetch</code>. Calling{' '}
                <code className="text-[var(--accent-primary)]">res.json()</code> already parses the
                body for you, so parsing it again double-parses an object:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// Wrong — res.json() already returns parsed data
const data = await res.json();
const obj = JSON.parse(data); // SyntaxError: Unexpected token o

// Right — use it directly, no second parse
const obj = await res.json();`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Rule of thumb: only call JSON.parse() on raw text. If a value is already an object,
                you are done — do not parse it again.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                &quot;Unexpected end of JSON input&quot;
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                This message means the parser reached the end of the string before the JSON was
                complete. The usual causes are an{' '}
                <strong className="text-[var(--text-primary)]">empty string</strong>, a{' '}
                <strong className="text-[var(--text-primary)]">truncated response</strong> (the
                network call failed or returned nothing), or JSON that is missing its closing brace
                or bracket.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`JSON.parse('');        // SyntaxError: Unexpected end of JSON input
JSON.parse('{"a":1');  // SyntaxError: Unexpected end of JSON input
JSON.parse(localStorage.getItem('missing')); // null -> throws`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Guard against empty or missing input before you parse, and supply a sensible
                fallback:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`function parseOrDefault(text, fallback = null) {
  if (!text || !text.trim()) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                &quot;Unexpected token &lt; in JSON&quot;
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                When the token is <code className="text-[var(--accent-primary)]">&lt;</code>, the
                server almost certainly returned{' '}
                <strong className="text-[var(--text-primary)]">HTML instead of JSON</strong> — that
                first <code className="text-[var(--accent-primary)]">&lt;</code> is the start of{' '}
                <code className="text-[var(--accent-primary)]">&lt;!DOCTYPE html&gt;</code> or{' '}
                <code className="text-[var(--accent-primary)]">&lt;html&gt;</code>. This typically
                happens when a request hits a 404 page, a login redirect, or a server error page
                rather than your API endpoint.
              </p>
              <p className="text-[var(--text-secondary)] mb-4">
                Check <code className="text-[var(--accent-primary)]">res.ok</code> and the response
                content type before parsing, and log the raw text when something looks off:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`const res = await fetch('/api/users');

if (!res.ok) {
  throw new Error('Request failed: ' + res.status);
}

const type = res.headers.get('content-type') || '';
if (!type.includes('application/json')) {
  const raw = await res.text();
  console.error('Expected JSON, got:', raw.slice(0, 200));
  throw new Error('Response was not JSON');
}

const data = await res.json();`}</code>
              </pre>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Trailing commas, single quotes, and unquoted keys
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                JSON is stricter than a JavaScript object literal. Three habits carried over from
                JavaScript all throw &quot;Unexpected token&quot; errors: trailing commas, single
                quotes, and unquoted keys.
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// Invalid JSON
{
  name: 'Ada',        // unquoted key + single quotes
  roles: ['admin',],  // trailing comma
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                The valid version uses double quotes everywhere — on both keys and string values —
                and removes the trailing comma:
              </p>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`// Valid JSON
{
  "name": "Ada",
  "roles": ["admin"]
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                Comments are not allowed in JSON either, and the only valid quote character is the
                double quote. Our{' '}
                <Link
                  href="/guides/common-json-errors"
                  className="text-[var(--accent-primary)] underline"
                >
                  common JSON errors guide
                </Link>{' '}
                walks through each of these in detail.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                How to debug it fast
              </h2>
              <p className="text-[var(--text-secondary)] mb-4">
                When you are staring at an &quot;Unexpected token&quot; error, three steps usually
                pin it down in under a minute:
              </p>
              <ul className="space-y-2 text-[var(--text-secondary)] mb-4">
                <li>
                  <strong className="text-[var(--text-primary)]">Log the raw string</strong> right
                  before you parse it. Seeing the actual text — empty, HTML, or already an object —
                  often answers the question instantly.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">Paste it into a validator</strong>{' '}
                  to jump straight to the exact position the error names, with the offending
                  character highlighted.
                </li>
                <li>
                  <strong className="text-[var(--text-primary)]">
                    Wrap JSON.parse() in try/catch
                  </strong>{' '}
                  so a bad payload degrades gracefully instead of crashing your app.
                </li>
              </ul>
              <pre className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">{`console.log('Raw input:', JSON.stringify(text));

try {
  const data = JSON.parse(text);
} catch (err) {
  console.error('Parse failed:', err.message);
}`}</code>
              </pre>
              <p className="text-[var(--text-secondary)] mt-4">
                For a deeper look at what JSON.parse() expects and how it works, see our{' '}
                <Link href="/guides/json-parse" className="text-[var(--accent-primary)] underline">
                  JSON.parse() guide
                </Link>
                .
              </p>
            </section>

            {/* CTA */}
            <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Pinpoint the exact token that breaks your JSON
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Paste the broken JSON into our free formatter to jump straight to the failing
                position, highlight the unexpected token, and auto-fix common mistakes — no more
                guessing where the error is.
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
                href="/guides/json-parse"
                className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--accent-primary)] transition-colors"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">JSON.parse() Explained</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Syntax, examples, and the errors it throws
                </p>
              </Link>
            </div>
          </nav>
        </article>
      </div>
    </>
  );
}
