import { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface ToolPageProps {
  params: {
    tool: string;
  };
}

const toolMetadata: Record<string, Metadata> = {
  'json-formatter': {
    title: 'JSON Formatter Online - Format & Beautify JSON Data',
    description: 'Free online JSON formatter to format, beautify, and pretty print JSON data. Make your JSON readable with proper indentation and syntax highlighting.',
    keywords: 'json formatter, format json, json beautifier, pretty print json, json formatting online',
  },
  'json-validator': {
    title: 'JSON Validator Online - Validate JSON Syntax & Structure',
    description: 'Free online JSON validator to check and validate JSON syntax. Get instant error messages with line numbers to fix JSON issues quickly.',
    keywords: 'json validator, validate json, json syntax checker, json lint, json validation online',
  },
  'json-viewer': {
    title: 'JSON Viewer Online - View & Explore JSON Data',
    description: 'Free online JSON viewer with tree view, graph visualization, and interactive exploration. Navigate complex JSON structures easily.',
    keywords: 'json viewer, view json, json tree view, json visualization, json explorer',
  },
  'json-beautifier': {
    title: 'JSON Beautifier Online - Beautify & Format JSON',
    description: 'Free online JSON beautifier to make your JSON data readable and well-formatted. Add proper indentation and formatting instantly.',
    keywords: 'json beautifier, beautify json, json pretty print, json formatter beautifier',
  },
  'json-editor': {
    title: 'JSON Editor Online - Edit JSON with Syntax Highlighting',
    description: 'Free online JSON editor with syntax highlighting, auto-completion, and real-time validation. Edit JSON data easily in your browser.',
    keywords: 'json editor, edit json online, json editor online, json code editor',
  },
  'json-parser': {
    title: 'JSON Parser Online - Parse & Analyze JSON Data',
    description: 'Free online JSON parser to parse, analyze, and understand JSON structure. Convert JSON strings to objects with error handling.',
    keywords: 'json parser, parse json, json parsing, json analyzer, json string parser',
  },
};

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const metadata = toolMetadata[params.tool];
  
  if (!metadata) {
    return {
      title: 'JSON Tools - Free Online JSON Formatter & Viewer',
      description: 'Free online JSON tools for formatting, validating, and viewing JSON data.',
    };
  }

  return {
    ...metadata,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: 'website',
      url: `https://jsonformatter.me/tools/${params.tool}`,
    },
    alternates: {
      canonical: `https://jsonformatter.me/tools/${params.tool}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(toolMetadata).map((tool) => ({
    tool,
  }));
}

export default function ToolPage({ params }: ToolPageProps) {
  // All tool pages redirect to the main page
  // This is for SEO purposes - we want these URLs indexed
  // but the actual functionality is on the main page
  redirect('/');
  
  return null;
}