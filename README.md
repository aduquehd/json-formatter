# JSON Viewer

A modern web application for viewing and formatting JSON data with a VS Code-style editor interface.

## Features

- **Monaco Editor**: VS Code-style code editor with syntax highlighting, line numbers, and minimap
- **JSON Formatting**: Paste raw or encoded JSON and format it with proper indentation
- **Tree View**: Interactive tree view with expand/collapse functionality
- **Real-time Validation**: Live JSON validation with error highlighting
- **Code Folding**: Collapse and expand JSON sections
- **Theme Support**: Light and dark themes with automatic editor theme switching
- **Modern UI**: Clean, responsive design that works on all devices
- **No Database**: Simple, stateless application

## Requirements

- Docker and Docker Compose

## Quick Start with Docker

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

5. Open your browser and go to `http://localhost:8000`

## Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed:

```bash
# Analytics Configuration (optional)
GA_TRACKING_ID=G-xxxxxxxx

# Application Configuration  
APP_ENV=development
DEBUG=false
```

### Environment Variables

- **`GA_TRACKING_ID`** (optional): Google Analytics 4 tracking ID for web analytics
- **`APP_ENV`**: Application environment (`development`, `production`)
- **`DEBUG`**: Enable/disable debug mode (`true`, `false`)

## Development

### Docker Development Setup

For development with auto-reload:

```bash
# Development mode with volume mounting for live changes
docker-compose -f docker-compose.dev.yml up --build
```

### Local Development (without Docker)

If you prefer to develop locally:

#### Requirements
- Python 3.12+
- Node.js and npm
- UV (Python package manager)

#### Setup
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
   uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### TypeScript Development

- TypeScript files are in `static/ts/`
- Compiled JavaScript goes to `static/js/` (auto-generated, not committed to repo)
- CSS files are in `static/css/`
- HTML templates are in `templates/`

**Important:** The generated JavaScript files are automatically created from TypeScript and should never be edited directly.

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

### Code Formatting

Format code with Prettier:

```bash
# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .
```

### Linting

Python code linting:

```bash
uv run ruff check    # Check for issues
uv run ruff format   # Format Python code
```

## Docker Commands

### Production
```bash
# Build and run production container
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop containers
docker-compose down
```

### Development
```bash
# Development with live reload
docker-compose -f docker-compose.dev.yml up --build

# Rebuild containers
docker-compose build --no-cache
```

## Project Structure

```
json-viewer/
├── main.py                    # FastAPI application
├── Dockerfile                 # Docker container definition
├── docker-compose.yml         # Production Docker Compose
├── docker-compose.dev.yml     # Development Docker Compose
├── docker-compose.prod.yml    # Production Docker Compose
├── templates/
│   └── index.html             # Main HTML template
├── static/
│   ├── css/
│   │   └── styles.css         # Application styles
│   ├── js/                    # Compiled JavaScript (auto-generated)
│   └── ts/                    # TypeScript source files
│       ├── app.ts             # Main application
│       └── utils/             # Utility modules
├── package.json               # Node.js dependencies
├── tsconfig.json              # TypeScript configuration
└── pyproject.toml             # Python dependencies
```

## Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: TypeScript, Monaco Editor
- **Styling**: CSS with CSS Variables for theming
- **Build Tool**: TypeScript Compiler (tsc)
- **Containerization**: Docker & Docker Compose