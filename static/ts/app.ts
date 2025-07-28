"use strict";

import { DOMElements, AppState, JSONValue } from './utils/types.js';
import { initializeElements, switchTab, showPasteMode, showFormattedMode, clearOutput } from './utils/dom-utils.js';
import { parseJSON, formatJSON, compactJSON } from './utils/json-utils.js';
import { generateTreeView } from './utils/tree-utils.js';

declare var toastr: any;

class JSONViewer {
  private elements: DOMElements;
  private state: AppState;

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
    this.bindEvents();
  }

  private bindEvents(): void {
    this.elements.formatBtn.addEventListener("click", () => this.formatJSON());
    this.elements.compactBtn.addEventListener("click", () => this.compactJSON());
    this.elements.clearBtn.addEventListener("click", () => this.clearAll());
    this.elements.copyBtn.addEventListener("click", () => this.copyJSON());
    this.elements.pasteBtn.addEventListener("click", () => this.pasteFromClipboard());
    
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
    e.preventDefault();

    const clipboardData = e.clipboardData || (window as any).clipboardData;

    if (clipboardData.files && clipboardData.files.length > 0) {
      toastr.error("Only text content is allowed. Images and files cannot be pasted.");
      return;
    }

    const pastedText = clipboardData.getData("text/plain") || clipboardData.getData("text");

    if (!pastedText) {
      toastr.error("No text content found in clipboard.");
      return;
    }

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
      }
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
  }

  private showFormattedMode(): void {
    this.state.isFormatted = true;
    showFormattedMode(this.elements);
  }

  private copyJSON(): void {
    const content = this.elements.formattedOutput.textContent?.trim() || "";
    
    if (!content) {
      toastr.warning("No content to copy!");
      return;
    }

    navigator.clipboard.writeText(content).then(() => {
      toastr.success("JSON copied to clipboard!");
    }).catch(err => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toastr.success("JSON copied to clipboard!");
      } catch (err) {
        toastr.error("Failed to copy JSON. Please try selecting and copying manually.");
      }
      
      document.body.removeChild(textArea);
    });
  }

  private pasteFromClipboard(): void {
    navigator.clipboard.readText().then(text => {
      if (text) {
        this.elements.formattedOutput.textContent = text;
        this.showPasteMode();
        toastr.success("Content pasted from clipboard!");
      } else {
        toastr.warning("Clipboard is empty!");
      }
    }).catch(err => {
      // Fallback message for browsers that don't support clipboard API
      toastr.error("Unable to access clipboard. Please paste manually using Ctrl+V or Cmd+V.");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new JSONViewer();
});