export interface MinimapElements {
  container: HTMLElement;
  content: HTMLElement;
  viewport: HTMLElement;
}

export class Minimap {
  private editor: HTMLElement;
  private elements: MinimapElements;
  private isUpdating: boolean = false;
  private isDragging: boolean = false;
  private lastMouseY: number = 0;

  constructor(editor: HTMLElement, elements: MinimapElements) {
    this.editor = editor;
    this.elements = elements;
    this.elements.container.style.cursor = 'grab';
    this.bindEvents();
  }

  private bindEvents(): void {
    // Update minimap when editor content changes
    const observer = new MutationObserver(() => {
      if (!this.isUpdating) {
        this.updateContent();
      }
    });
    
    observer.observe(this.editor, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Update viewport when editor scrolls
    this.editor.addEventListener('scroll', () => {
      this.updateViewport();
    });

    // Handle clicks on minimap to navigate
    this.elements.viewport.addEventListener('click', (e) => {
      if (!this.isDragging) {
        this.handleMinimapClick(e);
      }
    });

    this.elements.container.addEventListener('click', (e) => {
      if (e.target === this.elements.container && !this.isDragging) {
        this.handleMinimapClick(e);
      }
    });

    // Handle mouse down for drag start
    this.elements.container.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });

    // Handle mouse move for dragging
    document.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    // Handle mouse up for drag end
    document.addEventListener('mouseup', () => {
      this.handleMouseUp();
    });

    // Update on window resize
    window.addEventListener('resize', () => {
      this.updateViewport();
    });
  }

  private updateContent(): void {
    this.isUpdating = true;
    const content = this.editor.textContent || '';
    this.elements.content.textContent = content;
    
    // Update viewport after content changes
    requestAnimationFrame(() => {
      this.updateViewport();
      this.isUpdating = false;
    });
  }

  private updateViewport(): void {
    const editorRect = this.editor.getBoundingClientRect();
    const editorScrollTop = this.editor.scrollTop;
    const editorScrollHeight = this.editor.scrollHeight;
    const editorClientHeight = this.editor.clientHeight;

    if (editorScrollHeight <= editorClientHeight) {
      // No scroll needed, hide viewport
      this.elements.viewport.style.display = 'none';
      return;
    }

    this.elements.viewport.style.display = 'block';

    // Account for minimap content padding (4px from CSS)
    const minimapPadding = 4;
    const minimapHeight = this.elements.container.clientHeight - (minimapPadding * 2);
    const availableHeight = minimapHeight;
    
    const viewportHeight = Math.max(
      20, // minimum viewport height
      (editorClientHeight / editorScrollHeight) * availableHeight
    );
    const viewportTop = (editorScrollTop / editorScrollHeight) * availableHeight + minimapPadding;

    this.elements.viewport.style.height = `${viewportHeight}px`;
    this.elements.viewport.style.top = `${viewportTop}px`;
  }

  private handleMinimapClick(e: MouseEvent): void {
    const containerRect = this.elements.container.getBoundingClientRect();
    const clickY = e.clientY - containerRect.top;
    
    // Account for minimap content padding
    const minimapPadding = 4;
    const minimapHeight = this.elements.container.clientHeight - (minimapPadding * 2);
    const adjustedClickY = Math.max(0, clickY - minimapPadding);
    
    const scrollPercentage = adjustedClickY / minimapHeight;
    const editorScrollHeight = this.editor.scrollHeight;
    const editorClientHeight = this.editor.clientHeight;
    const maxScroll = editorScrollHeight - editorClientHeight;
    
    const targetScrollTop = scrollPercentage * maxScroll;
    this.editor.scrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop));
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseY = e.clientY;
    this.elements.container.style.cursor = 'grabbing';
    e.preventDefault();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaY = e.clientY - this.lastMouseY;
    this.lastMouseY = e.clientY;

    // Account for minimap content padding
    const minimapPadding = 4;
    const minimapHeight = this.elements.container.clientHeight - (minimapPadding * 2);
    const editorScrollHeight = this.editor.scrollHeight;
    const editorClientHeight = this.editor.clientHeight;
    const maxScroll = editorScrollHeight - editorClientHeight;

    // Calculate scroll delta based on mouse movement
    const scrollRatio = editorScrollHeight / minimapHeight;
    const scrollDelta = deltaY * scrollRatio;
    
    const newScrollTop = this.editor.scrollTop + scrollDelta;
    this.editor.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
  }

  private handleMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.elements.container.style.cursor = 'grab';
    }
  }

  public show(): void {
    this.elements.container.style.display = 'block';
    this.updateContent();
  }

  public hide(): void {
    this.elements.container.style.display = 'none';
  }

  public refresh(): void {
    this.updateContent();
  }
}