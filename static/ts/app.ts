"use strict";

declare var toastr: any;

class JSONViewer {
  private formattedOutput: any;
  private treeOutput: any;
  private formatBtn: any;
  private clearBtn: any;
  private tabBtns: any;
  private tabContents: any;
  private pasteHint: any;
  private editHint: any;
  private isFormatted: boolean;

  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.isFormatted = false;
  }

  initializeElements() {
    this.formattedOutput = document.getElementById("formattedOutput");
    this.treeOutput = document.getElementById("treeOutput");
    this.formatBtn = document.getElementById("formatBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.tabBtns = document.querySelectorAll(".tab-btn");
    this.tabContents = document.querySelectorAll(".tab-content");
    this.pasteHint = document.getElementById("pasteHint");
    this.editHint = document.getElementById("editHint");
  }

  bindEvents() {
    this.formatBtn.addEventListener("click", () => this.formatJSON());
    this.clearBtn.addEventListener("click", () => this.clearAll());
    this.tabBtns.forEach((btn: any) => {
      btn.addEventListener("click", (e: any) => {
        const target = e.target;
        const tabName = target.getAttribute("data-tab");
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });
    this.formattedOutput.addEventListener("input", () => {});
    this.formattedOutput.addEventListener("blur", () => {
      if (this.isFormatted) {
        this.handleFormattedEdit();
      }
    });
    this.formattedOutput.addEventListener("keydown", (e: any) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (this.isFormatted) {
          this.handleFormattedEdit();
        } else {
          this.formatJSON();
        }
      }
    });
    this.formattedOutput.addEventListener("paste", (e: any) => this.handlePaste(e));
  }

  formatJSON() {
    const input = this.formattedOutput.textContent?.trim() || "";
    if (!input) {
      toastr.error("Please paste some JSON data first");
      this.formattedOutput.focus();
      return;
    }
    try {
      let parsedJSON;
      try {
        parsedJSON = JSON.parse(input);
      } catch {
        const decodedInput = decodeURIComponent(input);
        parsedJSON = JSON.parse(decodedInput);
      }
      const formattedJSON = JSON.stringify(parsedJSON, null, 2);
      this.formattedOutput.textContent = formattedJSON;
      this.generateTreeView(parsedJSON);
      this.showFormattedMode();
      toastr.success("JSON formatted successfully!");
    } catch (error) {
      toastr.error(`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
      this.formattedOutput.focus();
    }
  }

  generateTreeView(data: any) {
    this.treeOutput.innerHTML = "";
    const rootNode = this.createTreeNode(data, "root");
    this.treeOutput.appendChild(rootNode);
  }

  createTreeNode(value: any, key: any, level = 0) {
    const container = document.createElement("div");
    container.className = "tree-node";
    container.style.marginLeft = `${level * 20}px`;
    const header = document.createElement("div");
    header.className = "tree-node-header";
    const type = this.getValueType(value);
    const isExpandable = type === "object" || type === "array";
    if (isExpandable) {
      const toggle = document.createElement("span");
      toggle.className = "tree-toggle";
      toggle.textContent = "▼";
      toggle.addEventListener("click", () => this.toggleNode(container, toggle));
      header.appendChild(toggle);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "tree-spacer";
      header.appendChild(spacer);
    }
    const keySpan = document.createElement("span");
    keySpan.className = "tree-key";
    if (key && key !== "root") {
      keySpan.textContent = `"${key}": `;
    }
    header.appendChild(keySpan);
    const valueSpan = document.createElement("span");
    valueSpan.className = `tree-value tree-${type}`;
    if (type === "object") {
      const keys = Object.keys(value);
      valueSpan.textContent = `{} (${keys.length} ${keys.length === 1 ? "property" : "properties"})`;
    } else if (type === "array") {
      valueSpan.textContent = `[] (${value.length} ${value.length === 1 ? "item" : "items"})`;
    } else if (type === "string") {
      valueSpan.textContent = `"${value}"`;
    } else {
      valueSpan.textContent = String(value);
    }
    header.appendChild(valueSpan);
    container.appendChild(header);
    if (isExpandable) {
      const childContainer = document.createElement("div");
      childContainer.className = "tree-children";
      if (type === "object") {
        Object.entries(value).forEach(([childKey, childValue]) => {
          const childNode = this.createTreeNode(childValue, childKey, level + 1);
          childContainer.appendChild(childNode);
        });
      } else if (type === "array") {
        value.forEach((childValue: any, index: any) => {
          const childNode = this.createTreeNode(childValue, `[${index}]`, level + 1);
          childContainer.appendChild(childNode);
        });
      }
      container.appendChild(childContainer);
    }
    return container;
  }

  toggleNode(container: any, toggle: any) {
    const children = container.querySelector(".tree-children");
    if (children) {
      const isExpanded = children.style.display !== "none";
      children.style.display = isExpanded ? "none" : "block";
      toggle.textContent = isExpanded ? "▶" : "▼";
    }
  }

  getValueType(value: any) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  }

  switchTab(tabName: any) {
    this.tabBtns.forEach((btn: any) => btn.classList.remove("active"));
    this.tabContents.forEach((content: any) => content.classList.remove("active"));
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeBtn && activeContent) {
      activeBtn.classList.add("active");
      activeContent.classList.add("active");
    }
  }

  clearAll() {
    this.formattedOutput.textContent = "";
    this.treeOutput.innerHTML = "";
    this.showPasteMode();
  }

  showPasteMode() {
    this.isFormatted = false;
    this.pasteHint.style.display = "flex";
    this.editHint.style.display = "none";
    this.formattedOutput.classList.add("paste-mode");
    this.formattedOutput.classList.remove("formatted-mode");
    this.formatBtn.textContent = "Format JSON";
  }

  showFormattedMode() {
    this.isFormatted = true;
    this.pasteHint.style.display = "none";
    this.editHint.style.display = "flex";
    this.formattedOutput.classList.remove("paste-mode");
    this.formattedOutput.classList.add("formatted-mode");
    this.formatBtn.textContent = "Re-format JSON";
  }

  handleFormattedEdit() {
    if (!this.isFormatted) return;

    const editedContent = this.formattedOutput.textContent || "";

    try {
      const parsedJSON = JSON.parse(editedContent);
      this.generateTreeView(parsedJSON);
      toastr.success("Changes saved successfully!");
    } catch (error) {
      toastr.error(`Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => {
        this.formattedOutput.focus();
      }, 100);
    }
  }

  handlePaste(e: any) {
    e.preventDefault();

    const clipboardData = e.clipboardData || (window as any).clipboardData;

    // Check if clipboard contains files (images, etc.)
    if (clipboardData.files && clipboardData.files.length > 0) {
      toastr.error("Only text content is allowed. Images and files cannot be pasted.");
      return;
    }

    // Get text data only
    const pastedText = clipboardData.getData("text/plain") || clipboardData.getData("text");

    if (!pastedText) {
      toastr.error("No text content found in clipboard.");
      return;
    }

    // Insert the text at cursor position or replace selection
    const selection = window.getSelection();
    if (selection!.rangeCount > 0) {
      const range = selection!.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(pastedText));

      // Move cursor to end of inserted text
      range.collapse(false);
      selection!.removeAllRanges();
      selection!.addRange(range);
    } else {
      // Fallback: append to end
      this.formattedOutput.textContent += pastedText;
    }

    // Trigger paste mode if not formatted
    setTimeout(() => {
      if (!this.isFormatted) {
        this.showPasteMode();
      }
    }, 10);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new JSONViewer();
});
