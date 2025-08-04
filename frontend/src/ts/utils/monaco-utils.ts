declare var require: any;
declare var monaco: any;

export interface MonacoEditorConfig {
  container: HTMLElement;
  isDarkTheme: boolean;
}

export function initializeMonacoEditor(config: MonacoEditorConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    // Check if Monaco is already loaded
    if ((window as any).monaco) {
      defineCustomThemes(); // Ensure themes are always defined
      const editor = createEditor(config);
      resolve(editor);
      return;
    }

    // Load Monaco Editor loader script dynamically
    if (!(window as any).require) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      script.onload = () => {
        loadMonacoEditor(config, resolve, reject);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Monaco Editor loader'));
      };
      document.head.appendChild(script);
    } else {
      loadMonacoEditor(config, resolve, reject);
    }
  });
}

function loadMonacoEditor(config: MonacoEditorConfig, resolve: Function, reject: Function): void {
  // Only configure require once
  if (!(window as any).monacoRequireConfigured) {
    require.config({
      paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs" },
    });
    (window as any).monacoRequireConfigured = true;
  }

  require(["vs/editor/editor.main"], () => {
    defineCustomThemes();
    const editor = createEditor(config);
    setupJSONValidation();
    resolve(editor);
  });
}

function createEditor(config: MonacoEditorConfig): any {
  // Remove loading placeholder
  const loadingElement = config.container.querySelector('.monaco-editor-loading');
  if (loadingElement) {
    loadingElement.remove();
  }
  
  // Create editor with automaticLayout disabled initially to prevent reflows
  const editor = monaco.editor.create(config.container, {
    value: "",
    language: "json",
    theme: "vs-dark",
    automaticLayout: false,
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
    fontLigatures: true,
    lineHeight: 1.7,
    minimap: {
      enabled: true,
      renderCharacters: false,
    },
    folding: true,
    lineNumbers: "on",
    lineNumbersMinChars: 4,
    lineDecorationsWidth: 0,
    renderLineHighlight: "all",
    renderLineHighlightOnlyWhenFocus: false,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    wrappingStrategy: "advanced",
    formatOnPaste: true,
    formatOnType: true,
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    autoIndent: "full",
    tabSize: 2,
    insertSpaces: true,
    trimAutoWhitespace: true,
    matchBrackets: "always",
    bracketPairColorization: {
      enabled: true,
    },
    padding: {
      top: 16,
      bottom: 16,
    },
    scrollbar: {
      vertical: "visible",
      horizontal: "visible",
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
  });

  // Enable automatic layout after initial render to avoid reflows
  requestAnimationFrame(() => {
    editor.updateOptions({ automaticLayout: true });
  });

  return editor;
}

function defineCustomThemes(): void {
  // Define custom themes only once
  if ((window as any).monacoThemesDefined) {
    return;
  }

  monaco.editor.defineTheme("custom-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "d73a49" },
      { token: "string.value.json", foreground: "22863a" },
      { token: "number", foreground: "005cc5" },
      { token: "keyword.json", foreground: "d73a49" },
      { token: "delimiter.bracket.json", foreground: "24292e" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292e",
      "editor.lineHighlightBackground": "#f6f8fa",
      "editorLineNumber.foreground": "#656d76",
      "editorLineNumber.activeForeground": "#24292e",
      "editor.selectionBackground": "#0366d625",
      "editor.inactiveSelectionBackground": "#0366d615",
    },
  });

  monaco.editor.defineTheme("custom-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "7aa2f7" },
      { token: "string.value.json", foreground: "9ece6a" },
      { token: "number", foreground: "ff9e64" },
      { token: "keyword.json", foreground: "bb9af7" },
      { token: "delimiter.bracket.json", foreground: "565f89" },
      { token: "delimiter.colon.json", foreground: "565f89" },
      { token: "delimiter.comma.json", foreground: "565f89" },
    ],
    colors: {
      "editor.background": "#24283b",
      "editor.foreground": "#c0caf5",
      "editor.lineHighlightBackground": "#292e42",
      "editorLineNumber.foreground": "#3b4261",
      "editorLineNumber.activeForeground": "#7aa2f7",
      "editorGutter.background": "#1f2335",
      "editor.selectionBackground": "#364a82",
      "editor.inactiveSelectionBackground": "#364a8244",
      "editorCursor.foreground": "#7aa2f7",
      "editor.lineHighlightBorder": "transparent",
      "editorBracketMatch.background": "#364a8266",
      "editorBracketMatch.border": "#7aa2f7",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#565f8933",
      "scrollbarSlider.hoverBackground": "#565f8955",
      "scrollbarSlider.activeBackground": "#565f8977",
    },
  });

  // GitHub Light theme
  monaco.editor.defineTheme("github-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "d73a49" },
      { token: "string.value.json", foreground: "032f62" },
      { token: "number", foreground: "005cc5" },
      { token: "keyword.json", foreground: "e36209" },
      { token: "delimiter.bracket.json", foreground: "24292e" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292e",
      "editor.lineHighlightBackground": "#f6f8fa",
      "editorLineNumber.foreground": "#959da5",
      "editorLineNumber.activeForeground": "#24292e",
      "editor.selectionBackground": "#0366d625",
      "editor.inactiveSelectionBackground": "#0366d615",
    },
  });

  // GitHub Dark theme
  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "f97583" },
      { token: "string.value.json", foreground: "9ecbff" },
      { token: "number", foreground: "79b8ff" },
      { token: "keyword.json", foreground: "f97583" },
      { token: "delimiter.bracket.json", foreground: "e1e4e8" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b22",
      "editorLineNumber.foreground": "#8b949e",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.selectionBackground": "#3392ff44",
      "editor.inactiveSelectionBackground": "#3392ff22",
    },
  });

  // Monokai theme
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "f92672" },
      { token: "string.value.json", foreground: "e6db74" },
      { token: "number", foreground: "ae81ff" },
      { token: "keyword.json", foreground: "f92672" },
      { token: "delimiter.bracket.json", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editorLineNumber.foreground": "#75715e",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.selectionBackground": "#49483e",
      "editor.inactiveSelectionBackground": "#49483e99",
    },
  });

  // Dracula theme
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "ff79c6" },
      { token: "string.value.json", foreground: "f1fa8c" },
      { token: "number", foreground: "bd93f9" },
      { token: "keyword.json", foreground: "ff79c6" },
      { token: "delimiter.bracket.json", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#44475a",
      "editorLineNumber.foreground": "#6272a4",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.selectionBackground": "#44475a",
      "editor.inactiveSelectionBackground": "#44475a99",
    },
  });

  (window as any).monacoThemesDefined = true;
}

function setupJSONValidation(): void {
  // Configure JSON language features
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [],
    allowComments: false,
    trailingCommas: false,
  });
}

export function setMonacoTheme(editor: any, themeName?: string, isDarkTheme?: boolean): void {
  if (editor && (window as any).monaco) {
    // Ensure themes are defined before setting
    defineCustomThemes();

    if (themeName) {
      // Use specific theme if provided
      monaco.editor.setTheme(themeName);
    } else if (isDarkTheme !== undefined) {
      // Fall back to light/dark theme based on isDarkTheme
      monaco.editor.setTheme(isDarkTheme ? "custom-dark" : "custom-light");
    }
  }
}
