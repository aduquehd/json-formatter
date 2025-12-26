'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import ControlButtons from '@/components/ControlButtons';
import TabsContainer from '@/components/TabsContainer';
import EditorView from '@/components/EditorView';
import TreeView from '@/components/TreeView';
import JsonExampleModal from '@/components/JsonExampleModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import EditorErrorBoundary from '@/components/EditorErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { useNotification } from '@/hooks/useNotification';
import { JSONFixer } from '@/utils/jsonFixer';
import { formatJSON, compactJSON } from '@/utils/jsonUtils';
import * as gtag from '@/lib/gtag';

// Lazy load heavy components for better performance
const GraphView = dynamic(
  () => import('@/components/GraphView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph View...</div>,
    ssr: false
  }
);

const DiffView = dynamic(
  () => import('@/components/DiffView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Diff View...</div>,
    ssr: false
  }
);

const StatsView = dynamic(
  () => import('@/components/StatsView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Stats View...</div>,
    ssr: false
  }
);

const MapView = dynamic(
  () => import('@/components/MapView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Map View...</div>,
    ssr: false
  }
);

const ChartView = dynamic(
  () => import('@/components/ChartView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Chart View...</div>,
    ssr: false
  }
);

const SearchView = dynamic(
  () => import('@/components/SearchView'),
  {
    loading: () => <div className="flex items-center justify-center h-full">Loading Search View...</div>,
    ssr: false
  }
);

export default function Home() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [editorContent, setEditorContent] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('formatted');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [isUpdatingFromTree, setIsUpdatingFromTree] = useState(false);
  const [skipValidation, setSkipValidation] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    if (!isUpdatingFromTree && !skipValidation && editorContent) {
      const result = JSONFixer.parseWithFixInfo(editorContent);
      if (result.error) {
        setParsedJson(null);
      } else {
        setParsedJson(result.data);
      }
    } else if (!editorContent) {
      setParsedJson(null);
    }
    
    // Reset skip validation flag
    if (skipValidation) {
      setSkipValidation(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent, isUpdatingFromTree, skipValidation]);

  const handleFormat = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }
    
    // Track format action
    gtag.trackJsonFormat();
    
    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);
    
    if (result.data) {
      const formatted = JSON.stringify(result.data, null, 2);
      
      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(formatted);
      setParsedJson(result.data);
      
      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
    }
  };

  const handleCompact = () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }
    
    // Track compact action
    gtag.trackJsonCompact();
    
    // Try to parse and potentially fix the JSON
    const result = JSONFixer.parseWithFixInfo(editorContent);
    
    if (result.data) {
      const compacted = JSON.stringify(result.data);
      
      // Set skip validation flag to prevent useEffect from running
      setSkipValidation(true);
      setEditorContent(compacted);
      setParsedJson(result.data);
      
      if (result.wasFixed && result.fixes && result.fixes.length > 0) {
        setTimeout(() => {
          showWarning(`JSON was automatically fixed: ${result.fixes!.join(', ')}`);
        }, 100);
      }
    } else {
      showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
    }
  };

  const handleClear = () => {
    gtag.trackJsonClear();
    setEditorContent('');
    setParsedJson(null);
  };

  const handleCopy = async () => {
    if (!editorContent || editorContent.trim() === '') {
      showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
      return;
    }
    
    gtag.trackJsonCopy();
    
    try {
      await navigator.clipboard.writeText(editorContent);
      
      // Check if the content is valid JSON
      try {
        JSON.parse(editorContent);
        // Success - no notification needed
      } catch {
        showWarning((mounted ? t('messages.copySuccess') : 'Copied to clipboard') + ' (Note: Invalid JSON)');
      }
    } catch (error) {
      showError(mounted ? t('messages.errorCopy') : 'Failed to copy to clipboard');
    }
  };

  const handlePaste = async () => {
    gtag.trackJsonPaste();
    
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === '') {
        showError(mounted ? t('messages.errorEmpty') : 'Please enter some JSON to format');
        return;
      }
      
      // Try to parse and potentially fix the JSON
      const result = JSONFixer.parseWithFixInfo(text);
      
      if (result.data) {
        // JSON was successfully parsed (possibly after fixing)
        const formatted = JSON.stringify(result.data, null, 2);
        
        // Set skip validation flag to prevent useEffect from running
        setSkipValidation(true);
        
        // Update editor content with fixed JSON
        setEditorContent(formatted);
        
        // Update parsed JSON directly
        setParsedJson(result.data);
        
        setActiveTab('formatted');
        
        if (result.wasFixed && result.fixes && result.fixes.length > 0) {
          // JSON was fixed - show warning after a brief delay to ensure UI updates
          setTimeout(() => {
            showWarning(mounted ? t('messages.warningFixed') : `JSON was automatically fixed: ${result.fixes!.join(', ')}`);
          }, 100);
        } else {
          // JSON was valid - no notification needed
        }
      } else {
        // Could not parse or fix the JSON
        setEditorContent(text);
        setActiveTab('formatted');
        showError(result.error || (mounted ? t('messages.errorInvalid') : 'Invalid JSON format'));
      }
    } catch (error) {
      showError(mounted ? t('messages.errorPaste') : 'Failed to paste from clipboard');
    }
  };

  const handleExampleSelect = (exampleContent: string) => {
    // Track example usage
    const exampleName = exampleContent.includes('products') ? 'ecommerce' : 
                       exampleContent.includes('sales') ? 'financial' :
                       exampleContent.includes('database') ? 'configuration' :
                       exampleContent.includes('coordinates') ? 'geographic' : 'unknown';
    gtag.trackExampleUsed(exampleName);
    
    try {
      // Format the example content immediately
      const formatted = formatJSON(exampleContent);
      setEditorContent(formatted);
    } catch {
      // If formatting fails, just use the original content
      setEditorContent(exampleContent);
    }
    setShowExampleModal(false);
    setActiveTab('formatted');
  };

  const handleTreeUpdate = (newContent: string) => {
    setIsUpdatingFromTree(true);
    setEditorContent(newContent);
    setTimeout(() => setIsUpdatingFromTree(false), 100);
  };

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggleTheme} />

      {/* Main Tool Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-5 pt-24 sm:pt-20 md:pt-20 pb-3 sm:pb-4 md:pb-5">
        <main id="main-content" className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg h-[calc(100vh-108px)] sm:h-[calc(100vh-104px)] md:h-[calc(100vh-100px)] flex flex-col backdrop-blur-xl">
          <div className="mb-2 sm:mb-3">
            <ControlButtons
              onFormat={handleFormat}
              onCompact={handleCompact}
              onClear={handleClear}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onExampleClick={() => setShowExampleModal(true)}
              theme={theme}
              onThemeToggle={toggleTheme}
            />
          </div>

          <TabsContainer
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              gtag.trackTabSwitch(tab);
            }}
          />

          <div className="flex-1 overflow-hidden">
            {activeTab === 'formatted' && (
              <EditorErrorBoundary>
                <EditorView
                  content={editorContent}
                  onChange={setEditorContent}
                  theme={theme}
                />
              </EditorErrorBoundary>
            )}
            {activeTab === 'tree' && (
              <ErrorBoundary>
                <TreeView
                  json={parsedJson}
                  onUpdate={handleTreeUpdate}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'graph' && (
              <ErrorBoundary>
                <GraphView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'diff' && (
              <ErrorBoundary>
                <DiffView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'stats' && (
              <ErrorBoundary>
                <StatsView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'map' && (
              <ErrorBoundary>
                <MapView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'chart' && (
              <ErrorBoundary>
                <ChartView json={parsedJson} />
              </ErrorBoundary>
            )}
            {activeTab === 'search' && (
              <ErrorBoundary>
                <SearchView json={parsedJson} />
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>

      {/* SEO Content Sections - Visible for users and search engines */}
      <div className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        {/* Features Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
            Why Use Our JSON Formatter?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Instant JSON Formatting</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Paste your JSON and get beautifully formatted output in one click. Our formatter adds proper indentation and makes your JSON human-readable.
              </p>
            </article>
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Interactive JSON Viewer</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Explore JSON with our tree view. Expand and collapse nodes, search for keys, and navigate complex nested structures with ease.
              </p>
            </article>
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">JSON Validation</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Validate JSON syntax in real-time. Get clear error messages with line numbers to quickly identify and fix issues in your JSON data.
              </p>
            </article>
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Auto-Fix JSON Errors</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Our smart JSON fixer automatically corrects common errors like trailing commas, single quotes, and unquoted keys.
              </p>
            </article>
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">100% Privacy</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                All JSON processing happens in your browser. Your data never leaves your computer - no servers, no tracking, complete privacy.
              </p>
            </article>
            <article className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Advanced Features</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Beyond formatting: JSON diff comparison, statistics, graph visualization, geographic map view, and more powerful tools.
              </p>
            </article>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-12 border-t border-[var(--border-color)]">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
            How to Format JSON Online
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Paste Your JSON</h3>
                <p className="text-sm text-[var(--text-secondary)]">Copy your raw JSON data and paste it into the editor above, or click the Paste button.</p>
              </div>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Click Format</h3>
                <p className="text-sm text-[var(--text-secondary)]">Press the Format button to beautify your JSON with proper indentation and formatting.</p>
              </div>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Copy & Use</h3>
                <p className="text-sm text-[var(--text-secondary)]">Your formatted JSON is ready. Copy it to clipboard or explore it in Tree View.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-12 border-t border-[var(--border-color)]">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                What is a JSON formatter?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                A JSON formatter is a tool that takes raw or minified JSON data and formats it with proper indentation and line breaks, making it easier to read and understand. Our JSON formatter adds 2-space indentation, organizes nested objects and arrays, and highlights syntax for better visibility.
              </p>
            </details>
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                What is a JSON viewer?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                A JSON viewer is an interactive tool that displays JSON data in a visual, navigable format. Unlike a simple text display, our JSON viewer provides a tree structure where you can expand and collapse nodes, search for specific keys, and explore complex nested data easily.
              </p>
            </details>
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                Is this JSON formatter free?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                Yes, jsonformatter.me is completely free to use with no limitations. There are no signup requirements, no ads, and no data limits. You can format, validate, and view as much JSON as you need without any cost.
              </p>
            </details>
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                Is my JSON data secure?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                Absolutely. All JSON processing happens 100% in your browser - your data is never sent to any server. This means your sensitive JSON data stays on your computer, making it completely safe to use for confidential information.
              </p>
            </details>
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                Can this tool fix invalid JSON?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                Yes! Our JSON formatter includes an intelligent auto-fix feature that can automatically correct common JSON errors such as trailing commas, single quotes instead of double quotes, unquoted keys, and missing commas. When errors are fixed, you&apos;ll see a notification showing what was corrected.
              </p>
            </details>
            <details className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 group">
              <summary className="font-semibold text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                What features does the JSON viewer have?
                <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-[var(--text-secondary)] text-sm">
                Our JSON viewer includes: Tree View for hierarchical navigation, Graph View for visual representation, Diff View for comparing two JSON files, Stats View for analyzing JSON structure, Search for finding specific keys or values, and Chart View for visualizing numeric data.
              </p>
            </details>
          </div>
        </section>

        {/* Tool Links Section for Internal Linking */}
        <section className="container mx-auto px-4 py-12 border-t border-[var(--border-color)]">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] text-center mb-8">
            More JSON Tools
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            <a href="/tools/json-formatter" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Formatter</h3>
            </a>
            <a href="/tools/json-viewer" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Viewer</h3>
            </a>
            <a href="/tools/json-validator" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Validator</h3>
            </a>
            <a href="/tools/json-beautifier" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Beautifier</h3>
            </a>
            <a href="/tools/json-editor" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Editor</h3>
            </a>
            <a href="/tools/json-parser" className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 text-center hover:border-[var(--accent-primary)] transition-colors">
              <h3 className="font-medium text-[var(--text-primary)] text-sm">JSON Parser</h3>
            </a>
          </div>
        </section>

        {/* About Section */}
        <section className="container mx-auto px-4 py-12 border-t border-[var(--border-color)]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              About JSON Formatter
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              jsonformatter.me is a free, open-source online tool for formatting, viewing, and validating JSON data.
              Built for developers, it provides a fast and secure way to work with JSON without sending your data to any server.
            </p>
            <p className="text-[var(--text-secondary)]">
              Whether you&apos;re debugging API responses, working with configuration files, or analyzing data, our JSON
              formatter and viewer makes it easy to understand and work with JSON data.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-[var(--border-color)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-secondary)]">
            <p>&copy; {new Date().getFullYear()} jsonformatter.me - Free Online JSON Tools</p>
            <nav className="flex gap-6">
              <a href="/guides" className="hover:text-[var(--accent-primary)] transition-colors">Guides</a>
              <a href="/help" className="hover:text-[var(--accent-primary)] transition-colors">Help</a>
              <a href="https://github.com/aduquehd/json-viewer" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-primary)] transition-colors">GitHub</a>
            </nav>
          </div>
        </footer>
      </div>

      {showExampleModal && (
        <JsonExampleModal
          onSelect={handleExampleSelect}
          onClose={() => setShowExampleModal(false)}
        />
      )}
    </>
  );
}