# JSON Viewer - React/Next.js Version

This is a complete redesign of the JSON Viewer application using React, Next.js, pnpm, and modern tooling.

## Features

All the original features have been preserved:

- ✅ **Monaco Editor Integration** - VS Code-style JSON editor with syntax highlighting
- ✅ **Tree View** - Interactive expandable/collapsible JSON tree with inline editing
- ✅ **Graph View** - D3.js visualization of JSON structure
- ✅ **Statistics** - Detailed analysis of JSON data types and structure
- ✅ **Diff View** - Side-by-side JSON comparison
- ✅ **Charts** - Visual representation of data distribution
- ✅ **Search & Filter** - Advanced JSON searching capabilities
- ✅ **Map View** - Geographic data visualization with Leaflet
- ✅ **Dark/Light Theme** - Automatic theme switching
- ✅ **JSON Examples** - Pre-built JSON examples for testing
- ✅ **Format/Compact** - JSON formatting and minification
- ✅ **Copy/Paste** - Clipboard integration
- ✅ **JSON Auto-fix** - Automatic correction of common JSON errors

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor (VS Code editor)
- **Charts**: Chart.js with react-chartjs-2
- **Graphs**: D3.js
- **Maps**: Leaflet with react-leaflet
- **Notifications**: Notyf
- **Package Manager**: pnpm

## Installation

1. Install pnpm if you haven't already:
```bash
npm install -g pnpm
```

2. Navigate to the react-app directory:
```bash
cd react-app
```

3. Install dependencies:
```bash
pnpm install
```

## Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

Build for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## Project Structure

```
react-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Main application page
│   │   └── globals.css     # Global styles and CSS variables
│   ├── components/
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── ControlButtons.tsx # Format/Compact/Copy buttons
│   │   ├── TabsContainer.tsx  # Tab navigation
│   │   ├── EditorView.tsx     # Monaco editor component
│   │   ├── TreeView.tsx       # Interactive JSON tree
│   │   ├── GraphView.tsx      # D3 graph visualization
│   │   ├── StatsView.tsx      # JSON statistics
│   │   ├── DiffView.tsx       # JSON comparison
│   │   ├── ChartView.tsx      # Data charts
│   │   ├── SearchView.tsx     # Search functionality
│   │   ├── MapView.tsx        # Geographic visualization
│   │   └── JsonExampleModal.tsx # Example selector
│   ├── hooks/
│   │   ├── useTheme.ts        # Theme management hook
│   │   └── useNotification.ts # Notification system hook
│   └── utils/
│       ├── jsonFixer.ts       # JSON auto-correction
│       ├── jsonUtils.ts       # JSON formatting utilities
│       └── exampleData.ts     # Sample JSON data
├── public/
│   └── img/                   # Images and icons
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Key Improvements in React Version

1. **Component-based Architecture**: Clean separation of concerns with reusable React components
2. **State Management**: Efficient state handling with React hooks
3. **Type Safety**: Full TypeScript implementation for better development experience
4. **Performance**: Next.js optimizations including code splitting and lazy loading
5. **Modern Tooling**: Using pnpm for faster installations and better disk usage
6. **Server-Side Rendering**: Next.js SSR/SSG capabilities for better SEO and performance
7. **Responsive Design**: Tailwind CSS utilities for consistent responsive layouts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT