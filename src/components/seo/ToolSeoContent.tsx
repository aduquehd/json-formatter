import Link from 'next/link';
import { type ToolView, viewSeo } from '@/lib/tools';

/**
 * The SEO payload that sits below the workbench on every view route. The app
 * stays the hero at the top of the page; this is the visible, indexable content
 * that explains the tool — an intro, how-to steps, features, FAQ, and links to
 * related tools. Keeping it *visible* (not `sr-only`) is deliberate: search
 * engines weight on-page text users can actually see, and these sections give
 * each view unique, substantive content to rank on. JSON-LD makes the FAQ,
 * how-to, and app eligible for rich results.
 */
export default function ToolSeoContent({ view }: { view: ToolView }) {
  const v = viewSeo[view];
  const url = `https://www.jsonformatter.me${v.path === '/' ? '/' : v.path}`;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: v.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: v.heading,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url,
    description: v.intro,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: v.features,
    isAccessibleForFree: true,
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${v.heading}`,
    step: v.howTo.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <section className="container mx-auto max-w-4xl border-t border-[var(--border-color)] px-4 py-12 sm:py-16">
        <header className="mb-10">
          <h1 className="mb-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {v.heading}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            {v.intro}
          </p>
        </header>

        {/* How to use */}
        <div className="mb-12">
          <h2 className="mb-5 text-xl font-bold text-[var(--text-primary)]">
            How to use {v.heading}
          </h2>
          <ol className="space-y-4">
            {v.howTo.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-sm font-semibold text-[var(--accent-color)]">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed text-[var(--text-secondary)]">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="mb-5 text-xl font-bold text-[var(--text-primary)]">Features</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {v.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4"
              >
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--accent-color)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[var(--text-secondary)]">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="mb-5 text-xl font-bold text-[var(--text-primary)]">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {v.faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5"
              >
                <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{faq.question}</h3>
                <p className="leading-relaxed text-[var(--text-secondary)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related tools */}
        <nav aria-label="Related tools">
          <h2 className="mb-5 text-xl font-bold text-[var(--text-primary)]">Related tools</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {v.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="block rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-colors hover:border-[var(--accent-color)]"
              >
                <h3 className="font-semibold text-[var(--text-primary)]">{r.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{r.description}</p>
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </>
  );
}
