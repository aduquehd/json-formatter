<div align="center">
  <h1>🎨 JSON Viewer</h1>
  <p>
    <strong>A modern web application for viewing and formatting JSON data with a VS Code-style editor interface</strong>
  </p>

  <!-- Badges -->
  <p>
    <a href="https://jsonformatter.me/">
      <img src="https://img.shields.io/badge/🔗%20Live%20Demo-Visit%20Site-blue?style=for-the-badge" alt="Live Demo">
    </a>
   </p>
   <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
  </p>
</div>

---

## ✨ Features

- 📝 **Monaco Editor**: VS Code-style code editor with syntax highlighting, line numbers, and minimap
- 🎯 **JSON Formatting**: Paste raw or encoded JSON and format it with proper indentation
- 🌳 **Tree View**: Interactive tree view with expand/collapse functionality and inline editing
- ✅ **Real-time Validation**: Live JSON validation with error highlighting
- 📁 **Code Folding**: Collapse and expand JSON sections
- 🎨 **Theme Support**: Light and dark themes with automatic editor theme switching
- 🔍 **Search & Replace**: Built-in search functionality with regex support
- 📋 **Copy to Clipboard**: One-click copy of formatted JSON
- 📱 **Modern UI**: Clean, responsive design that works on all devices
- 🔀 **JSON Diff View**: Compare two JSON objects side-by-side with highlighted differences
- 🏷️ **JavaScript Object Literal Support**: Parse and format JavaScript object literal syntax
- 📊 **Graph View**: Visualize JSON structure as an interactive network graph with D3.js
- 🗺️ **Map View**: Display geographical data on an interactive Leaflet map
- 📊 **Statistics View**: Detailed analysis of JSON data types and structure
- 🔧 **JSON Auto-fix**: Automatic correction of common JSON errors
- 🔒 **100% Local Processing**: All data processing happens in your browser—no data is ever sent to any server

## 📋 Requirements

- 📦 Node.js 18.x or later
- 🚀 pnpm (recommended) or npm

## 🚀 Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd json-viewer
   ```

2. Install dependencies using pnpm (recommended):
   ```bash
   pnpm install
   ```
   
   Or using npm:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Open your browser and go to `http://localhost:3000`

## 💻 Development

### 🛠️ Available Scripts

```bash
# Start development server with hot-reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### 🎨 Code Quality

The project uses ESLint for code quality and consistency:

```bash
# Check for linting issues
pnpm lint

# Auto-fix linting issues (when possible)
pnpm lint --fix
```

## 🏗️ Production Build

Build the application for production:

```bash
pnpm build
```

This will create an optimized production build with:
- 📦 Optimized bundle sizes
- 🚀 Code splitting
- 🖼️ Image optimization
- ⚡ Static asset caching

Start the production server:

```bash
pnpm start
```

The production server will run on `http://localhost:3000`

## 📂 Project Structure

```
json-viewer/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 🎨 globals.css         # Global styles and CSS variables
│   │   ├── 📄 layout.tsx          # Root layout with metadata
│   │   └── 📄 page.tsx            # Main application page
│   ├── 📁 components/             # React components
│   │   ├── 📝 EditorView.tsx      # Monaco Editor integration
│   │   ├── 🌳 TreeView.tsx        # Interactive JSON tree
│   │   ├── 📊 GraphView.tsx       # D3.js network visualization
│   │   ├── 🗺️ MapView.tsx         # Leaflet geographic visualization
│   │   ├── 🔀 DiffView.tsx        # JSON comparison tool
│   │   ├── 📊 StatsView.tsx       # JSON statistics analysis
│   │   ├── 🔍 SearchView.tsx      # Advanced search functionality
│   │   ├── 🎛️ ControlButtons.tsx  # Format/Compact/Copy controls
│   │   ├── 📑 TabsContainer.tsx   # Tab navigation system
│   │   ├── 🎯 Navbar.tsx          # Navigation bar
│   │   ├── 🌓 ThemeProvider.tsx   # Theme management
│   │   └── 📚 JsonExampleModal.tsx # Example JSON selector
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── 🎨 useTheme.ts         # Theme management hook
│   │   └── 🔔 useNotification.ts  # Notification system hook
│   └── 📁 utils/                  # Utility functions
│       ├── 🔧 jsonFixer.ts        # JSON auto-correction
│       ├── 📦 jsonUtils.ts        # JSON formatting utilities
│       └── 📝 exampleData.ts      # Sample JSON data
├── 📁 public/                     # Static assets
│   └── 📁 img/                    # Images and icons
├── 📦 package.json                # Dependencies and scripts
├── ⚙️ tsconfig.json               # TypeScript configuration
├── 🎨 tailwind.config.js          # Tailwind CSS configuration
├── 📄 postcss.config.js           # PostCSS configuration
├── 🚀 next.config.js              # Next.js configuration
```

## 🛠️ Technology Stack

### Frontend Framework

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)

### Styling

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

### Editor & Visualizations

![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0066CC?style=flat-square&logo=visualstudiocode&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F68E1E?style=flat-square&logo=d3dotjs&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)

### Development Tools

![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

## 🚀 Key Features Explained

### Monaco Editor Integration
Professional-grade code editor with VS Code features including:
- Syntax highlighting for JSON
- Auto-completion and IntelliSense
- Multiple cursors and selection
- Find and replace with regex support
- Code folding and minimap

### Interactive Visualizations
- **Tree View**: Navigate complex JSON structures with collapsible nodes
- **Graph View**: Network visualization using D3.js force-directed graphs
- **Map View**: GeoJSON support with interactive Leaflet maps

### Smart JSON Processing
- Automatic error detection and correction
- Support for JavaScript object literal syntax
- JSON minification and beautification
- Deep object comparison with diff highlighting

## 🔧 Configuration

### Theme Customization
Themes are configured in `src/app/globals.css` using CSS custom properties. The application supports automatic theme switching based on system preferences.

### Editor Settings
Monaco Editor can be customized in `src/components/EditorView.tsx`:
- Font size and family
- Tab size and indentation
- Word wrap and line numbers
- Minimap and scrollbar behavior

## 📦 Deployment

### Vercel (Recommended)
Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aduquehd/json-viewer)

### Manual Deployment
1. Build the application:
   ```bash
   pnpm build
   ```

2. The build output will be in `.next/` directory

3. Deploy using your preferred hosting service that supports Next.js

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>
    Made with ❤️ by <a href="https://github.com/aduquehd">aduquehd</a>
  </p>
  <p>
    <a href="https://jsonformatter.me/">🌐 Live Demo</a> • 
    <a href="https://github.com/aduquehd/json-formatter/issues">🐛 Report Bug</a> • 
    <a href="https://github.com/aduquehd/json-formatter/pulls">🚀 Request Feature</a>
  </p>
</div>