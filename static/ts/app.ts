"use strict";

import { DOMElements, AppState, JSONValue } from './utils/types.js';
import { initializeElements, switchTab, showPasteMode, showFormattedMode, clearOutput } from './utils/dom-utils.js';
import { parseJSON, formatJSON, compactJSON } from './utils/json-utils.js';
import { generateTreeView } from './utils/tree-utils.js';
import { Minimap } from './utils/minimap-utils.js';
import { copyToClipboard, pasteFromClipboard, handlePasteEvent } from './utils/clipboard-utils.js';

declare var toastr: any;

class JSONViewer {
  private elements: DOMElements;
  private state: AppState;
  private minimap: Minimap;

  constructor() {
    const elements = initializeElements();
    if (!elements) {
      throw new Error('Failed to initialize required DOM elements');
    }
    this.elements = elements;
    this.state = {
      isFormatted: false,
      currentTab: 'formatted'
    };
    
    this.minimap = new Minimap(this.elements.formattedOutput, {
      container: this.elements.minimapContainer,
      content: this.elements.minimapContent,
      viewport: this.elements.minimapViewport
    });
    
    this.bindEvents();
  }

  private bindEvents(): void {
    this.elements.formatBtn.addEventListener("click", () => this.formatJSON());
    this.elements.compactBtn.addEventListener("click", () => this.compactJSON());
    this.elements.clearBtn.addEventListener("click", () => this.clearAll());
    this.elements.copyBtn.addEventListener("click", () => this.copyJSON());
    this.elements.pasteBtn.addEventListener("click", () => this.pasteFromClipboardBtn());
    
    this.elements.tabBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute("data-tab");
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    this.elements.formattedOutput.addEventListener("blur", () => {
      if (this.state.isFormatted) {
        this.handleFormattedEdit();
      }
    });

    this.elements.formattedOutput.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (this.state.isFormatted) {
          this.handleFormattedEdit();
        } else {
          this.formatJSON();
        }
      }
    });

    this.elements.formattedOutput.addEventListener("paste", (e) => this.handlePaste(e));
  }

  private formatJSON(): void {
    const input = this.elements.formattedOutput.textContent?.trim() || "";
    const parseResult = parseJSON(input);

    if (!parseResult.success) {
      toastr.error(parseResult.error);
      this.elements.formattedOutput.focus();
      return;
    }

    const formattedJSON = formatJSON(parseResult.data!);
    this.elements.formattedOutput.textContent = formattedJSON;
    generateTreeView(parseResult.data!, this.elements.treeOutput);
    this.showFormattedMode();
    this.minimap.refresh();
    toastr.success("JSON formatted successfully!");
  }

  private compactJSON(): void {
    const input = this.elements.formattedOutput.textContent?.trim() || "";
    const parseResult = parseJSON(input);

    if (!parseResult.success) {
      toastr.error(parseResult.error);
      this.elements.formattedOutput.focus();
      return;
    }

    const compactedJSON = compactJSON(parseResult.data!);
    this.elements.formattedOutput.textContent = compactedJSON;
    generateTreeView(parseResult.data!, this.elements.treeOutput);
    this.showFormattedMode();
    this.minimap.refresh();
    toastr.success("JSON compacted successfully!");
  }

  private handleFormattedEdit(): void {
    if (!this.state.isFormatted) return;

    const editedContent = this.elements.formattedOutput.textContent || "";
    const parseResult = parseJSON(editedContent);

    if (!parseResult.success) {
      toastr.error(`Invalid JSON: ${parseResult.error}`);
      setTimeout(() => {
        this.elements.formattedOutput.focus();
      }, 100);
      return;
    }

    generateTreeView(parseResult.data!, this.elements.treeOutput);
    toastr.success("Changes saved successfully!");
  }

  private handlePaste(e: ClipboardEvent): void {
    const pastedText = handlePasteEvent(e);
    if (!pastedText) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(pastedText));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      this.elements.formattedOutput.textContent += pastedText;
    }

    setTimeout(() => {
      if (!this.state.isFormatted) {
        this.showPasteMode();
      } else {
        this.minimap.refresh();
      }
      // Auto-format the pasted JSON
      this.formatJSON();
    }, 10);
  }

  private switchTab(tabName: string): void {
    this.state.currentTab = tabName;
    switchTab(tabName, this.elements);
  }

  private clearAll(): void {
    clearOutput(this.elements);
    this.showPasteMode();
  }

  private showPasteMode(): void {
    this.state.isFormatted = false;
    showPasteMode(this.elements);
    this.minimap.hide();
  }

  private showFormattedMode(): void {
    this.state.isFormatted = true;
    showFormattedMode(this.elements);
    this.minimap.show();
  }

  private copyJSON(): void {
    const content = this.elements.formattedOutput.textContent?.trim() || "";
    copyToClipboard(content);
  }

  private pasteFromClipboardBtn(): void {
    pasteFromClipboard().then(text => {
      if (text) {
        this.elements.formattedOutput.textContent = text;
        this.showPasteMode();
        // Auto-format the pasted JSON
        setTimeout(() => {
          this.formatJSON();
        }, 10);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new JSONViewer();
});