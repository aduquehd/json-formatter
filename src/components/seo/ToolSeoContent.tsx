import { type ToolView, viewSeo } from '@/lib/tools';

/**
 * The SEO payload that sits below the workbench on every view route. App-first:
 * the page looks like the bare tool. The About + FAQ body text and the page's
 * single <h1> are kept in the DOM (visually hidden via `sr-only`) so crawlers
 * still index them, while the JSON-LD makes the FAQ and app eligible for rich
 * results. Nothing here is shown to sighted users — the UI stays just the tool.
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

      {/*
        Hidden from sighted users but present for crawlers / a11y. Keeps the
        page's single <h1> and the About + FAQ body text indexable without
        cluttering the app UI below the workbench.
      */}
      <section className="sr-only">
        <h1>{v.heading} — free online JSON tool</h1>

        <h2>About {v.heading}</h2>
        <p>{v.intro}</p>

        <h2>Frequently asked questions</h2>
        {v.faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </section>
    </>
  );
}
