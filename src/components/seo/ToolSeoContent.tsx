import { type ToolView, viewSeo } from '@/lib/tools';

/**
 * The SEO payload that sits below the workbench on every view route. App-first:
 * the page looks like the bare tool, with the page's single <h1> (visually
 * hidden) plus a collapsed About + FAQ. Native <details> keeps the content in
 * the DOM for crawlers while staying out of the way for users, and the JSON-LD
 * makes the FAQ and app eligible for rich results.
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

  const summaryCls =
    'flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-[var(--text-primary)] [&::-webkit-details-marker]:hidden';
  const chevron = (
    <svg
      className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  return (
    <section className="container mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-14 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      {/* The page's single h1 — hidden visually, present for crawlers / a11y. */}
      <h1 className="sr-only">{v.heading} — free online JSON tool</h1>

      <div className="space-y-3">
        <details className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <summary className={summaryCls}>
            <span>About {v.heading}</span>
            {chevron}
          </summary>
          <div className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed">{v.intro}</div>
        </details>

        <details className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <summary className={summaryCls}>
            <span>Frequently asked questions</span>
            {chevron}
          </summary>
          <div className="space-y-5 px-5 pb-5">
            {v.faqs.map((faq) => (
              <div key={faq.question}>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{faq.question}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
