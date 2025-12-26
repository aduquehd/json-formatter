import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ToolPageWrapper from './ToolPageWrapper';

interface ToolPageProps {
  params: Promise<{
    tool: string;
  }>;
}

// Comprehensive tool data for SEO and content
const toolData: Record<string, {
  metadata: Metadata;
  heading: string;
  subheading: string;
  description: string;
  features: { title: string; description: string }[];
  howTo: { step: number; title: string; description: string }[];
  useCases: string[];
  faqs: { question: string; answer: string }[];
  relatedTools: string[];
}> = {
  'json-formatter': {
    metadata: {
      title: 'JSON Formatter - Format & Beautify JSON Online',
      description: 'JSON Formatter online. Format JSON, beautify JSON, and pretty print JSON with proper indentation. Free JSON formatter tool.',
      keywords: 'json formatter, format json, json beautifier, pretty print json, json formatting, beautify json',
    },
    heading: 'JSON Formatter',
    subheading: 'Format and beautify JSON with one click',
    description: 'Our free JSON formatter transforms messy, minified, or hard-to-read JSON into clean, properly indented code. Perfect for developers, API debugging, and data analysis.',
    features: [
      { title: 'One-Click Formatting', description: 'Instantly format JSON with proper 2-space indentation and line breaks' },
      { title: 'Syntax Highlighting', description: 'Color-coded keys, values, strings, and numbers for easy reading' },
      { title: 'Auto-Fix Errors', description: 'Automatically fixes common JSON errors like trailing commas and single quotes' },
      { title: 'Large File Support', description: 'Handle JSON files of any size without performance issues' },
      { title: 'Copy to Clipboard', description: 'Copy formatted JSON with one click for use in your projects' },
      { title: '100% Private', description: 'All processing happens in your browser - data never leaves your computer' },
    ],
    howTo: [
      { step: 1, title: 'Paste Your JSON', description: 'Copy your raw JSON data and paste it into the editor above' },
      { step: 2, title: 'Click Format', description: 'Press the Format button or use the keyboard shortcut' },
      { step: 3, title: 'Copy the Result', description: 'Your formatted JSON is ready - copy it to your clipboard' },
    ],
    useCases: [
      'Formatting API responses for debugging',
      'Making minified JSON readable',
      'Preparing JSON for documentation',
      'Cleaning up configuration files',
      'Formatting JSON for code reviews',
    ],
    faqs: [
      { question: 'What is JSON formatting?', answer: 'JSON formatting is the process of adding proper indentation, line breaks, and spacing to JSON data to make it human-readable. Minified JSON saves space but is hard to read. Formatted JSON is easier to understand and debug.' },
      { question: 'How do I format JSON online?', answer: 'Simply paste your JSON into the editor and click the Format button. Our tool will automatically add proper indentation (2 spaces) and organize your JSON structure. You can also paste directly with Ctrl+V and the JSON will be formatted automatically.' },
      { question: 'Can I format invalid JSON?', answer: 'Yes! Our formatter includes an intelligent auto-fix feature that can correct common JSON errors like trailing commas, single quotes, unquoted keys, and missing commas. You\'ll see a notification showing what was fixed.' },
      { question: 'Is there a file size limit?', answer: 'No, there\'s no hard limit. Our formatter handles large JSON files efficiently. All processing happens in your browser, so performance depends on your device.' },
    ],
    relatedTools: ['json-viewer', 'json-validator', 'json-beautifier'],
  },
  'json-viewer': {
    metadata: {
      title: 'JSON Viewer - View & Explore JSON Data Online',
      description: 'JSON Viewer online. View JSON in tree view, explore JSON structure, and navigate JSON data. Free JSON viewer tool.',
      keywords: 'json viewer, view json, json tree view, json visualization, json explorer, json tree',
    },
    heading: 'JSON Viewer',
    subheading: 'Explore JSON with interactive tree view',
    description: 'Our JSON viewer provides an interactive way to explore and navigate JSON data. Use the tree view to expand/collapse nodes, or the graph view for visual representation of data relationships.',
    features: [
      { title: 'Interactive Tree View', description: 'Expand and collapse JSON nodes to explore nested data structures' },
      { title: 'Graph Visualization', description: 'See your JSON data as a visual graph showing relationships' },
      { title: 'Search & Filter', description: 'Find specific keys or values within large JSON documents' },
      { title: 'Path Display', description: 'See the full path to any selected node in your JSON' },
      { title: 'Edit in Place', description: 'Modify values directly in the tree view with live updates' },
      { title: 'Statistics View', description: 'Get insights about your JSON structure - depth, key count, data types' },
    ],
    howTo: [
      { step: 1, title: 'Load Your JSON', description: 'Paste your JSON into the editor or use the Paste button' },
      { step: 2, title: 'Switch to Tree View', description: 'Click the Tree tab to see your JSON as an interactive tree' },
      { step: 3, title: 'Explore Your Data', description: 'Click arrows to expand/collapse nodes and explore the structure' },
    ],
    useCases: [
      'Exploring API response structures',
      'Understanding complex configuration files',
      'Debugging nested data',
      'Navigating large JSON documents',
      'Visualizing data relationships',
    ],
    faqs: [
      { question: 'What is a JSON viewer?', answer: 'A JSON viewer is a tool that displays JSON data in an interactive, visual format instead of raw text. It typically shows data as a tree structure where you can expand and collapse nodes, making it easier to navigate complex nested data.' },
      { question: 'How is a JSON viewer different from a formatter?', answer: 'A JSON formatter beautifies the text representation of JSON with indentation. A JSON viewer goes further by providing interactive visualization - tree views, graphs, and the ability to explore data by clicking rather than scrolling through text.' },
      { question: 'Can I edit JSON in the viewer?', answer: 'Yes! Our tree view supports inline editing. Click on any value to modify it, and the changes will be reflected in the editor. This makes it easy to update specific values in large JSON documents.' },
      { question: 'What is the graph view for?', answer: 'The graph view shows JSON data as a visual network diagram, making it easier to understand relationships between different parts of your data. It\'s especially useful for data with many cross-references or nested structures.' },
    ],
    relatedTools: ['json-formatter', 'json-validator', 'json-parser'],
  },
  'json-validator': {
    metadata: {
      title: 'JSON Validator - Validate JSON Syntax Online',
      description: 'JSON Validator online. Validate JSON syntax, check JSON for errors, and fix JSON issues. Free JSON validator and JSON lint tool.',
      keywords: 'json validator, validate json, json syntax checker, json lint, jsonlint, check json',
    },
    heading: 'JSON Validator',
    subheading: 'Check JSON syntax and fix errors instantly',
    description: 'Our JSON validator checks your JSON for syntax errors and provides clear, actionable error messages. Find and fix issues quickly with line number references and automatic error correction.',
    features: [
      { title: 'Instant Validation', description: 'Real-time syntax checking as you type or paste JSON' },
      { title: 'Clear Error Messages', description: 'Detailed error descriptions with exact line and column numbers' },
      { title: 'Auto-Fix Common Errors', description: 'Automatically correct trailing commas, single quotes, and more' },
      { title: 'Syntax Highlighting', description: 'Visual cues help you spot issues before validation' },
      { title: 'Error Highlighting', description: 'Problem areas are highlighted directly in the editor' },
      { title: 'JSON Lint Compatible', description: 'Validates against the same rules as popular JSON linters' },
    ],
    howTo: [
      { step: 1, title: 'Paste Your JSON', description: 'Copy your JSON data and paste it into the editor' },
      { step: 2, title: 'View Results', description: 'Invalid JSON will show an error message with details' },
      { step: 3, title: 'Fix or Auto-Fix', description: 'Correct the error manually or click Format to auto-fix common issues' },
    ],
    useCases: [
      'Validating API request/response payloads',
      'Checking configuration files before deployment',
      'Debugging JSON parsing errors',
      'Verifying data before database import',
      'Ensuring JSON compliance in CI/CD pipelines',
    ],
    faqs: [
      { question: 'What does a JSON validator check?', answer: 'A JSON validator checks that your data follows the JSON specification: proper use of quotes, correct bracket matching, valid escape sequences, no trailing commas, and proper data types. It ensures your JSON can be parsed by any JSON parser.' },
      { question: 'What are common JSON errors?', answer: 'Common errors include: trailing commas after the last item, single quotes instead of double quotes, unquoted keys, missing commas between items, and unclosed brackets or braces. Our validator detects all of these.' },
      { question: 'Is this the same as JSONLint?', answer: 'Our validator performs the same validation as JSONLint and other popular validators, but with additional features like auto-fix capabilities and a more user-friendly interface. It validates against the official JSON specification (RFC 8259).' },
      { question: 'Can you validate JSON against a schema?', answer: 'Currently, our validator checks JSON syntax validity. JSON Schema validation (checking if data matches a specific structure) is a different feature that we may add in the future.' },
    ],
    relatedTools: ['json-formatter', 'json-viewer', 'json-parser'],
  },
  'json-beautifier': {
    metadata: {
      title: 'JSON Beautifier - Beautify & Pretty Print JSON',
      description: 'JSON Beautifier online. Beautify JSON, pretty print JSON, and format JSON with proper indentation. Free JSON beautifier tool.',
      keywords: 'json beautifier, beautify json, json pretty print, pretty json, json prettify',
    },
    heading: 'JSON Beautifier',
    subheading: 'Make your JSON beautiful and readable',
    description: 'Transform minified, compressed, or messy JSON into beautifully formatted, human-readable code. Our beautifier adds proper indentation, line breaks, and spacing for maximum readability.',
    features: [
      { title: 'Pretty Print', description: 'Convert minified JSON to formatted, readable code with 2-space indentation' },
      { title: 'Preserve Order', description: 'Keys and arrays maintain their original order after beautification' },
      { title: 'Smart Formatting', description: 'Optimal line breaks and spacing for readability' },
      { title: 'Minify Option', description: 'Reverse the process - compact formatted JSON for production use' },
      { title: 'Syntax Colors', description: 'Beautiful color scheme highlights different JSON elements' },
      { title: 'Works Offline', description: 'Use the beautifier even without internet after first load' },
    ],
    howTo: [
      { step: 1, title: 'Input Your JSON', description: 'Paste minified or messy JSON into the editor' },
      { step: 2, title: 'Click Format', description: 'Press the Format button to beautify your JSON' },
      { step: 3, title: 'Copy Beautiful JSON', description: 'Your beautified JSON is ready to use' },
    ],
    useCases: [
      'Making API responses readable for debugging',
      'Formatting JSON for documentation',
      'Beautifying minified config files',
      'Preparing JSON for presentations',
      'Making JSON diffs more readable',
    ],
    faqs: [
      { question: 'What is the difference between beautify and format?', answer: 'In practice, "beautify" and "format" are used interchangeably for JSON. Both refer to adding indentation, line breaks, and proper spacing to make JSON human-readable. Our tool does both!' },
      { question: 'What indentation does the beautifier use?', answer: 'Our beautifier uses 2-space indentation by default, which is the most common standard for JSON. This provides good readability while keeping files compact.' },
      { question: 'Can I beautify minified JSON?', answer: 'Minified JSON (all on one line with no spaces) is exactly what this tool is designed for. Paste your minified JSON and click Format to expand it into readable, properly indented code.' },
      { question: 'Can I also minify/compact JSON?', answer: 'Yes! Use the Compact button to do the reverse - remove all whitespace and create a single-line, minified version of your JSON. Great for reducing file size for production.' },
    ],
    relatedTools: ['json-formatter', 'json-viewer', 'json-validator'],
  },
  'json-editor': {
    metadata: {
      title: 'JSON Editor - Edit JSON Online with Syntax Highlighting',
      description: 'JSON Editor online. Edit JSON with syntax highlighting, auto-completion, and validation. Free JSON editor tool.',
      keywords: 'json editor, edit json, json editor online, json code editor, edit json online',
    },
    heading: 'JSON Editor',
    subheading: 'Edit JSON with a powerful code editor',
    description: 'Our JSON editor provides a VS Code-like editing experience with syntax highlighting, bracket matching, and real-time validation. Perfect for creating, editing, and debugging JSON data.',
    features: [
      { title: 'Monaco Editor', description: 'Same powerful editor used in VS Code with full JSON support' },
      { title: 'Syntax Highlighting', description: 'Color-coded JSON elements for easy editing' },
      { title: 'Auto-Completion', description: 'Smart suggestions as you type JSON structures' },
      { title: 'Bracket Matching', description: 'Easily find matching brackets and braces' },
      { title: 'Real-Time Validation', description: 'Errors are highlighted as you type' },
      { title: 'Find & Replace', description: 'Search and replace text within your JSON' },
    ],
    howTo: [
      { step: 1, title: 'Start Editing', description: 'Type or paste JSON directly into the editor' },
      { step: 2, title: 'Use Editor Features', description: 'Take advantage of syntax highlighting and auto-completion' },
      { step: 3, title: 'Validate & Export', description: 'Format your JSON and copy it when ready' },
    ],
    useCases: [
      'Creating JSON configuration files',
      'Editing API request payloads',
      'Modifying JSON data structures',
      'Writing JSON by hand with assistance',
      'Quick JSON prototyping',
    ],
    faqs: [
      { question: 'What editor powers this tool?', answer: 'We use the Monaco Editor, the same editor that powers Visual Studio Code. It provides professional-grade editing features including syntax highlighting, auto-completion, and error detection.' },
      { question: 'Does it support keyboard shortcuts?', answer: 'Yes! Standard editor shortcuts work: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+F (find), Ctrl+H (replace), and many more. The editor supports all Monaco/VS Code keyboard shortcuts.' },
      { question: 'Can I edit large JSON files?', answer: 'Yes, the Monaco editor is optimized for large files. It uses virtualization to only render visible content, making it efficient even for JSON documents with thousands of lines.' },
      { question: 'Is there auto-completion for JSON?', answer: 'Yes, as you type, the editor suggests JSON structures like brackets, quotes, and common patterns. It also helps close brackets and quotes automatically.' },
    ],
    relatedTools: ['json-formatter', 'json-viewer', 'json-validator'],
  },
  'json-parser': {
    metadata: {
      title: 'JSON Parser - Parse & Analyze JSON Online',
      description: 'JSON Parser online. Parse JSON strings, analyze JSON structure, and decode JSON data. Free JSON parser tool.',
      keywords: 'json parser, parse json, json parsing, json analyzer, json decode',
    },
    heading: 'JSON Parser',
    subheading: 'Parse and analyze JSON data structure',
    description: 'Our JSON parser converts JSON strings into a structured format you can explore and analyze. Understand the hierarchy, data types, and structure of your JSON data.',
    features: [
      { title: 'String to Object', description: 'Parse JSON strings into explorable JavaScript objects' },
      { title: 'Structure Analysis', description: 'See the hierarchy and nesting of your JSON data' },
      { title: 'Type Detection', description: 'Identify data types for each value (string, number, boolean, null, array, object)' },
      { title: 'Statistics', description: 'Get counts of keys, values, depth levels, and data types' },
      { title: 'Error Handling', description: 'Clear messages when JSON cannot be parsed' },
      { title: 'Path Extraction', description: 'Get the path to any element in your JSON structure' },
    ],
    howTo: [
      { step: 1, title: 'Input JSON String', description: 'Paste your JSON string into the editor' },
      { step: 2, title: 'Parse Automatically', description: 'The parser will analyze your JSON instantly' },
      { step: 3, title: 'Explore Structure', description: 'Use Tree or Stats view to understand your data' },
    ],
    useCases: [
      'Understanding API response structures',
      'Analyzing data before processing',
      'Debugging JSON parsing issues',
      'Learning JSON structure for development',
      'Extracting paths for data access',
    ],
    faqs: [
      { question: 'What is JSON parsing?', answer: 'JSON parsing is the process of converting a JSON string into a data structure (like a JavaScript object) that can be programmatically accessed. Our parser shows you the result of this conversion in an interactive format.' },
      { question: 'How is parsing different from formatting?', answer: 'Formatting changes how JSON text looks (adding indentation). Parsing actually interprets the JSON and converts it to a data structure. Our tool does both - it parses the JSON and then lets you explore the parsed result.' },
      { question: 'What do the statistics show?', answer: 'The Stats view shows: total keys count, maximum nesting depth, counts of each data type (strings, numbers, booleans, nulls, arrays, objects), and array lengths. Great for understanding large JSON documents.' },
      { question: 'Can I see the path to a specific value?', answer: 'Yes! In the Tree view, when you select or hover over a node, you can see its full path (like "data.users[0].name"). This is useful for writing code to access that value.' },
    ],
    relatedTools: ['json-viewer', 'json-formatter', 'json-validator'],
  },
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool } = await params;
  const data = toolData[tool];

  if (!data) {
    return {
      title: 'JSON Tools - Free Online JSON Formatter & Viewer',
      description: 'Free online JSON tools for formatting, validating, and viewing JSON data.',
    };
  }

  return {
    ...data.metadata,
    openGraph: {
      title: data.metadata.title as string,
      description: data.metadata.description as string,
      type: 'website',
      url: `https://www.jsonformatter.me/tools/${tool}`,
      siteName: 'jsonformatter.me',
      images: [{
        url: '/img/og-image.png',
        width: 1200,
        height: 630,
        alt: data.heading,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.metadata.title as string,
      description: data.metadata.description as string,
      images: ['/img/og-image.png'],
    },
    alternates: {
      canonical: `https://www.jsonformatter.me/tools/${tool}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(toolData).map((tool) => ({
    tool,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const data = toolData[tool];

  if (!data) {
    notFound();
  }

  // Structured data for this specific tool page
  const toolJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.heading,
    applicationCategory: 'DeveloperApplication',
    description: data.metadata.description,
    url: `https://www.jsonformatter.me/tools/${tool}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: data.features.map(f => f.title),
    isAccessibleForFree: true,
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${data.heading}`,
    description: data.description,
    step: data.howTo.map((step) => ({
      '@type': 'HowToStep',
      position: step.step,
      name: step.title,
      text: step.description,
    })),
    totalTime: 'PT1M',
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.jsonformatter.me/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: data.heading,
        item: `https://www.jsonformatter.me/tools/${tool}`,
      },
    ],
  };

  const relatedTools = data.relatedTools.map(t => toolData[t]).filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ToolPageWrapper>
        <div className="min-h-screen bg-[var(--bg-primary)]">
          {/* Hero Section */}
          <section className="pt-24 pb-8 px-4">
            <div className="container mx-auto max-w-6xl">
              {/* Breadcrumb */}
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-[var(--text-secondary)]">
                  <li>
                    <Link href="/" className="hover:text-[var(--accent-primary)] transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>/</li>
                  <li className="text-[var(--text-primary)] font-medium">{data.heading}</li>
                </ol>
              </nav>

              {/* Page Header */}
              <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4">
                  {data.heading}
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                  {data.subheading}
                </p>
              </header>
            </div>
          </section>

          {/* CTA to Main Tool */}
          <section className="px-4 pb-12">
            <div className="container mx-auto max-w-2xl text-center">
              <Link
                href="/"
                className="inline-block bg-[var(--accent-primary)] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                Open {data.heading}
              </Link>
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Free, no signup required. Your data stays in your browser.
              </p>
            </div>
          </section>

          {/* Description Section */}
          <section className="py-12 px-4 bg-[var(--bg-secondary)]">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4 text-center">
                About This Tool
              </h2>
              <p className="text-[var(--text-secondary)] text-lg leading-relaxed text-center">
                {data.description}
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
                Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How To Section */}
          <section className="py-12 px-4 bg-[var(--bg-secondary)]">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
                How to Use
              </h2>
              <div className="space-y-6">
                {data.howTo.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-[var(--text-secondary)]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
                Common Use Cases
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.useCases.map((useCase, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-[var(--text-secondary)]"
                  >
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 px-4 bg-[var(--bg-secondary)]">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {data.faqs.map((faq, index) => (
                  <div key={index} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Related Tools Section */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
                Related Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.relatedTools.map((relatedTool) => {
                  const related = toolData[relatedTool];
                  if (!related) return null;
                  return (
                    <Link
                      key={relatedTool}
                      href={`/tools/${relatedTool}`}
                      className="block bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 hover:border-[var(--accent-primary)] transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                        {related.heading}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {related.subheading}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 px-4 bg-[var(--accent-primary)]">
            <div className="container mx-auto max-w-4xl text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Try All Our JSON Tools
              </h2>
              <p className="text-white/80 mb-6">
                Format, view, validate, compare, and analyze JSON - all in one place.
              </p>
              <Link
                href="/"
                className="inline-block bg-white text-[var(--accent-primary)] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to JSON Formatter
              </Link>
            </div>
          </section>
        </div>
      </ToolPageWrapper>
    </>
  );
}
