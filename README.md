<div align="center">
  <h1>🎨 JSON Viewer</h1>
  <p>
    <strong>A modern web application for viewing and formatting JSON data with a VS Code-style editor interface</strong>
  </p>

  <!-- Badges -->
  <p>
    <a href="https://jsonviewer.me/">
      <img src="https://img.shields.io/badge/🔗%20Live%20Demo-Visit%20Site-blue?style=for-the-badge" alt="Live Demo">
    </a>
   </p>
   <p>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  </p>
</div>

---

## ✨ Features

- 📝 **Monaco Editor**: VS Code-style code editor with syntax highlighting, line numbers, and minimap
- 🎯 **JSON Formatting**: Paste raw or encoded JSON and format it with proper indentation
- 🌳 **Tree View**: Interactive tree view with expand/collapse functionality
- ✅ **Real-time Validation**: Live JSON validation with error highlighting
- 📁 **Code Folding**: Collapse and expand JSON sections
- 🎨 **Theme Support**: Light and dark themes with automatic editor theme switching
- 🔍 **Search & Replace**: Built-in search functionality with regex support
- 🖨️ **Print Support**: Print-friendly formatted JSON output
- 📋 **Copy to Clipboard**: One-click copy of formatted JSON
- 🔧 **URL Parameter Support**: Load JSON from URL parameters
- 📱 **Modern UI**: Clean, responsive design that works on all devices
- 🚀 **No Database**: Simple, stateless application
- 🔀 **JSON Diff View**: Compare two JSON objects side-by-side with highlighted differences (additions, deletions, modifications)
- 🏷️ **JavaScript Object Literal Support**: Parse and format JavaScript object literal syntax in addition to standard JSON

## 📋 Requirements

- 🐳 Docker and Docker Compose

## 🚀 Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd json-viewer
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. (Optional) Edit `.env` to configure Google Analytics:
   ```bash
   # Edit .env and set your Google Analytics tracking ID
   GA_TRACKING_ID=G-XXXXXXXXXX
   ```

4. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

5. Open your browser and go to `http://localhost:8001`

## ⚙️ Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed:

```bash
# Analytics Configuration (optional)
GA_TRACKING_ID=G-xxxxxxxx
HOTJAR_ID=xxxxxxxx

# Application Configuration  
APP_ENV=development
DEBUG=false
```

### 🔧 Environment Variables

- **`GA_TRACKING_ID`** (optional): Google Analytics 4 tracking ID for web analytics
- **`HOTJAR_ID`** (optional): Hotjar site ID for user behavior analytics
- **`APP_ENV`**: Application environment (`development`, `production`)
- **`DEBUG`**: Enable/disable debug mode (`true`, `false`)

## 💻 Development

### 🐳 Docker Development Setup

For development with auto-reload:

```bash
# Development mode with volume mounting for live changes
docker-compose -f docker-compose.dev.yml up --build
```

### 🏠 Local Development (without Docker)

If you prefer to develop locally:

#### 📦 Requirements

- 🐍 Python 3.12+
- 📦 Node.js and npm
- 🚀 UV (Python package manager)

#### 🛠️ Setup

1. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Install Python dependencies:
   ```bash
   uv sync
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Compile TypeScript:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

### 📘 TypeScript Development

- TypeScript files are in `frontend/src/ts/`
- Compiled JavaScript goes to `static/js/` (auto-generated, not committed to repo)
- CSS source files are in `frontend/src/css/`
- CSS files are copied to `static/css/` during build
- HTML templates are in `templates/`

**Important:** 
- Never edit files in the `static/` directory - they are auto-generated
- All frontend source code is in the `frontend/src/` directory
- Run `npm run build` after making changes to TypeScript files

#### Build TypeScript:

```bash
npm run build
```

#### Watch TypeScript files during development:

```bash
npm run dev
# or
npm run watch
```

### 🎨 Code Formatting

Format code with Prettier:

```bash
# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .
```

### 🔍 Linting

Python code linting:

```bash
uv run ruff check    # Check for issues
uv run ruff format   # Format Python code
```

## 🐳 Docker Commands

### 🚀 Production

```bash
# Build and run production container
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop containers
docker-compose down
```

### 🔧 Development

```bash
# Development with live reload
docker-compose -f docker-compose.dev.yml up --build

# Rebuild containers
docker-compose build --no-cache
```

### 🏭 Production Deployment

```bash
# Build and run with production optimizations
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📂 Project Structure

```
json-viewer/
├── 🐍 main.py                    # FastAPI application
├── 🐳 Dockerfile                 # Docker container definition
├── 🐳 docker-compose.yml         # Production Docker Compose
├── 🐳 docker-compose.dev.yml     # Development Docker Compose
├── 🐳 docker-compose.prod.yml    # Production Docker Compose
├── 📁 templates/
│   └── 🌐 index.html             # Main HTML template with Jinja2
├── 📁 static/                    # Served static files (auto-generated)
│   ├── 🎨 css/                   # CSS (copied from frontend/src/css)
│   ├── 📦 js/                    # Compiled JavaScript (from TypeScript)
│   └── 🖼️ favicon.ico            # Site favicon
├── 📁 frontend/                  # Frontend source code
│   └── 📁 src/                   # Source files
│       ├── 📁 ts/                # TypeScript source
│       │   ├── 📘 app.ts         # Main JSONViewer class
│       │   ├── 📁 utils/         # Utility modules
│       │   │   ├── 📄 clipboard.ts    # Clipboard operations
│       │   │   ├── 📄 json.ts         # JSON parsing/validation
│       │   │   ├── 📄 theme.ts        # Theme management
│       │   │   ├── 📄 treeBuilder.ts  # Tree view generation
│       │   │   └── 📄 urlParams.ts    # URL parameter handling
│       │   └── 📁 types/         # TypeScript type definitions
│       └── 🎨 css/               # CSS source files
│           ├── styles.css        # Main styles
│           └── critical.css      # Critical path CSS
├── 📦 package.json               # Node.js dependencies
├── ⚙️ tsconfig.json              # TypeScript configuration
├── 🐍 pyproject.toml             # Python dependencies
├── 📋 CLAUDE.md                  # AI assistant instructions
├── 🔧 .env.example               # Example environment configuration
└── 📄 README.md                  # This file
```

## 🛠️ Technology Stack

### Backend

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Jinja](https://img.shields.io/badge/Jinja2-B41717?style=flat-square&logo=jinja&logoColor=white)

### Frontend

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)

### Editor & Tools

![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-0066CC?style=flat-square&logo=visualstudiocode&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)
![Ruff](https://img.shields.io/badge/Ruff-D7191C?style=flat-square&logo=python&logoColor=white)

### Infrastructure

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

---

<div align="center">
  <p>
    Made with ❤️ by <a href="https://github.com/aduquehd">aduquehd</a>
  </p>
  <p>
    <a href="https://jsonviewer.me/">🌐 Live Demo</a> • 
    <a href="https://github.com/aduquehd/json-viewer/issues">🐛 Report Bug</a> • 
    <a href="https://github.com/aduquehd/json-viewer/pulls">🚀 Request Feature</a>
  </p>
</div>