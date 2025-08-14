import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Code2, 
  Zap, 
  Shield, 
  BookOpen,
  Search,
  ChartBar,
  GitCompare,
  Map,
  TreePine,
  FileJson
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'JSON Formatter Help & Guide - How to Format JSON Online',
  description: 'Complete guide on how to use our free JSON formatter, validator, and viewer. Learn JSON syntax, common errors, best practices, and formatting tips.',
  keywords: 'json help, json guide, how to format json, json tutorial, json syntax, json errors, json best practices, json formatting guide, json validator help',
  openGraph: {
    title: 'JSON Formatter Help & Complete Guide',
    description: 'Learn how to format, validate, and view JSON with our comprehensive guide. JSON syntax, examples, and best practices.',
    type: 'article',
    url: 'https://jsonformatter.me/help',
  },
  alternates: {
    canonical: 'https://jsonformatter.me/help',
  }
};

export default function HelpPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is JSON?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'JSON (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and write, and easy for machines to parse and generate.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I format JSON online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply paste your JSON data into our editor and click the "Format" button. Our tool will automatically validate and beautify your JSON with proper indentation.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is this JSON formatter free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, our JSON formatter is completely free to use with no limitations, no ads, and no registration required.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my JSON data secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely! All JSON processing happens locally in your browser. No data is ever sent to our servers, ensuring complete privacy and security.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are common JSON syntax errors?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Common JSON errors include: missing quotes around keys, trailing commas, single quotes instead of double quotes, and undefined values. Our formatter automatically fixes many of these issues.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I validate JSON syntax?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, our tool automatically validates JSON syntax as you type and shows real-time error messages with line numbers to help you fix issues quickly.'
        }
      }
    ]
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'JSON Formatter',
        item: 'https://jsonformatter.me'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Help & Guide',
        item: 'https://jsonformatter.me/help'
      }
    ]
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Format JSON Online',
    description: 'Step-by-step guide to format, validate, and beautify JSON data using our free online tool.',
    totalTime: 'PT1M',
    supply: [],
    tool: [
      {
        '@type': 'HowToTool',
        name: 'JSON Formatter & Viewer'
      }
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Paste JSON Data',
        text: 'Copy your JSON data and paste it into the editor',
        url: 'https://jsonformatter.me/help#step1'
      },
      {
        '@type': 'HowToStep',
        name: 'Click Format Button',
        text: 'Click the "Format" button to beautify and validate your JSON',
        url: 'https://jsonformatter.me/help#step2'
      },
      {
        '@type': 'HowToStep',
        name: 'View Results',
        text: 'View your formatted JSON with syntax highlighting and explore different view modes',
        url: 'https://jsonformatter.me/help#step3'
      },
      {
        '@type': 'HowToStep',
        name: 'Copy or Download',
        text: 'Copy the formatted JSON or use it in tree view, graph view, or other visualizations',
        url: 'https://jsonformatter.me/help#step4'
      }
    ]
  };

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
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to JSON Formatter</span>
              </Link>
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li><Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Home</Link></li>
                  <li className="text-gray-400">/</li>
                  <li className="text-gray-700 dark:text-gray-200 font-medium">Help</li>
                </ol>
              </nav>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              JSON Formatter & Viewer Help Guide
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about formatting, validating, and viewing JSON data online
            </p>
          </header>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Start: How to Format JSON
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <ol className="space-y-6">
                <li id="step1" className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Paste Your JSON Data</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Copy your JSON data from any source and paste it into the editor. The tool accepts both valid and malformed JSON.
                    </p>
                  </div>
                </li>
                <li id="step2" className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Click Format</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Click the "Format" button to beautify your JSON with proper indentation. Invalid JSON will be automatically fixed when possible.
                    </p>
                  </div>
                </li>
                <li id="step3" className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Explore View Modes</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Switch between different views: Tree View for navigation, Graph View for visualization, Diff View for comparisons, and more.
                    </p>
                  </div>
                </li>
                <li id="step4" className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Copy or Download</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Use the "Copy" button to copy formatted JSON to clipboard, or continue working with your data in various visualization modes.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Features Overview
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <FileJson className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">JSON Editor</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Advanced Monaco editor with syntax highlighting, auto-completion, and real-time validation.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <TreePine className="w-10 h-10 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tree View</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Interactive tree visualization for easy navigation and editing of nested JSON structures.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <GitCompare className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Diff View</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Compare two JSON objects side-by-side with highlighted differences.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <ChartBar className="w-10 h-10 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Visualization</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Automatic chart generation from numerical JSON data with multiple chart types.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <Search className="w-10 h-10 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Search</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Search through JSON data with regex support, filters, and instant highlighting.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <Map className="w-10 h-10 text-teal-600 dark:text-teal-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Map View</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Visualize geographic JSON data on an interactive map with markers and regions.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              JSON Syntax Guide
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Valid JSON Rules</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Data must be in name/value pairs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Data is separated by commas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Curly braces {} hold objects</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Square brackets [] hold arrays</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Strings must be in double quotes ""</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Common JSON Errors</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Trailing Commas</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remove commas after the last item in objects or arrays</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Single Quotes</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Always use double quotes for strings, not single quotes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Unquoted Keys</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Object keys must always be enclosed in double quotes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Comments</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">JSON doesn't support comments (// or /* */)</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-16" id="faq">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What is JSON?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  JSON (JavaScript Object Notation) is a lightweight data-interchange format that is easy for humans to read and write, and easy for machines to parse and generate. It's based on JavaScript object syntax but is language-independent.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  How do I format JSON online?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Simply paste your JSON data into our editor and click the "Format" button. Our tool will automatically validate and beautify your JSON with proper indentation, making it easy to read and debug.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Is this JSON formatter free to use?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, our JSON formatter is completely free to use with no limitations. There are no ads, no registration required, and no hidden fees. You can format as much JSON as you need.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Is my JSON data secure?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely! All JSON processing happens locally in your browser using JavaScript. No data is ever sent to our servers, ensuring complete privacy and security for sensitive information.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What are common JSON syntax errors?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Common JSON errors include: missing quotes around keys, trailing commas, single quotes instead of double quotes, undefined values, and comments. Our formatter automatically fixes many of these issues.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I validate JSON syntax?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, our tool automatically validates JSON syntax as you type and shows real-time error messages with line numbers to help you fix issues quickly. Invalid JSON is highlighted immediately.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What's the difference between Format and Compact?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Format adds proper indentation and line breaks to make JSON readable. Compact removes all unnecessary whitespace to minimize file size, useful for production environments or APIs.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Can I edit JSON in tree view?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Our tree view is fully interactive. You can expand/collapse nodes, edit values directly, add new properties, delete nodes, and your changes will sync with the main editor.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What file size limits are there?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  There are no strict file size limits since processing happens in your browser. However, extremely large files (&gt;10MB) may impact performance depending on your device's capabilities.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Does the tool work offline?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Once the page is loaded, most features work offline since JSON processing happens locally. However, you need an internet connection to initially load the tool and access map features.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              JSON Best Practices
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Use Consistent Naming</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Stick to camelCase or snake_case throughout your JSON</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Keep It Simple</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avoid deeply nested structures when possible</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Use Arrays for Lists</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">When order matters or items are similar, use arrays instead of objects</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Validate Before Production</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Always validate JSON before using in production environments</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Use Meaningful Keys</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose descriptive property names that clearly indicate the data they hold</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Keyboard Shortcuts
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Editor Shortcuts</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Format JSON</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + Shift + F</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Find</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + F</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Replace</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + H</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Undo</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + Z</kbd>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Go to Line</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + G</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Fold All</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + K, 0</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Unfold All</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Ctrl/Cmd + K, J</kbd>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Command Palette</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">F1</kbd>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-start gap-4">
                <Shield className="w-12 h-12 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold mb-3">Privacy & Security First</h2>
                  <p className="text-blue-100 mb-4">
                    Your JSON data never leaves your browser. All processing is done locally using JavaScript, ensuring complete privacy and security for your sensitive data. No server uploads, no data storage, no tracking.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">100% Client-Side</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">No Data Storage</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Open Source</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">No Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Need More Help?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                If you have questions not covered in this guide, feel free to explore our tool or check out the source code on GitHub.
              </p>
              <div className="flex justify-center gap-4">
                <Link 
                  href="/" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Start Formatting JSON
                </Link>
                <a 
                  href="https://github.com/aduquehd/json-formatter" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 JSON Formatter & Viewer. Free, open-source, and privacy-focused.</p>
          </div>
        </footer>
      </div>
    </>
  );
}