import { JSONValue, ValueType, ParseResult } from "./types.js";
import { showError, showWarning } from "./notification-utils.js";
import { JSONFixer } from "../jsonFixer.js";
import { NotificationManager } from "./notification-manager.js";

export function parseJSON(input: string): ParseResult {
  if (!input.trim()) {
    return { success: false, error: "Please paste some JSON data first" };
  }

  try {
    const result = JSONFixer.parseWithFixInfo(input);
    if (result.wasFixed && result.fixes && NotificationManager.shouldShowFixNotification(result.fixes)) {
      const description = NotificationManager.getFixDescription(result.fixes);
      showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${description}`);
    }
    return { success: true, data: result.data };
  } catch {
    try {
      const decodedInput = decodeURIComponent(input);
      const result = JSONFixer.parseWithFixInfo(decodedInput);
      if (result.wasFixed && result.fixes && NotificationManager.shouldShowFixNotification(result.fixes)) {
        const description = NotificationManager.getFixDescription(result.fixes);
        showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${description}`);
      }
      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export function formatJSON(data: JSONValue): string {
  return JSON.stringify(data, null, 2);
}

export function compactJSON(data: JSONValue): string {
  return JSON.stringify(data);
}

export function formatJSONInEditor(editor: any): ParseResult {
  if (!editor) return { success: false, error: "Editor not initialized" };

  try {
    const content = editor.getValue();
    const result = JSONFixer.parseWithFixInfo(content);
    if (result.wasFixed && result.fixes && NotificationManager.shouldShowFixNotification(result.fixes)) {
      const description = NotificationManager.getFixDescription(result.fixes);
      showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${description}`);
    }
    const formatted = JSON.stringify(result.data, null, 2);
    editor.setValue(formatted);

    // Add pulse animation to format button
    const formatBtn = document.getElementById("formatBtn");
    if (formatBtn) {
      formatBtn.classList.add("formatted");
      setTimeout(() => formatBtn.classList.remove("formatted"), 400);
    }

    return { success: true, data: result.data };
  } catch (e: any) {
    showError(`Invalid JSON: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export function compactJSONInEditor(editor: any): ParseResult {
  if (!editor) return { success: false, error: "Editor not initialized" };

  try {
    const content = editor.getValue();
    const result = JSONFixer.parseWithFixInfo(content);
    if (result.wasFixed && result.fixes && NotificationManager.shouldShowFixNotification(result.fixes)) {
      const description = NotificationManager.getFixDescription(result.fixes);
      showWarning(`The JSON has a wrong structure, it has been repaired automatically: ${description}`);
    }
    const compacted = JSON.stringify(result.data);
    editor.setValue(compacted);

    // Add pulse animation to compact button
    const compactBtn = document.getElementById("compactBtn");
    if (compactBtn) {
      compactBtn.classList.add("compacted");
      setTimeout(() => compactBtn.classList.remove("compacted"), 400);
    }

    return { success: true, data: result.data };
  } catch (e: any) {
    showError(`Invalid JSON: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export function clearEditor(editor: any): void {
  if (editor) {
    editor.setValue("");

    // Add pulse animation to clear button
    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
      clearBtn.classList.add("cleared");
      setTimeout(() => clearBtn.classList.remove("cleared"), 400);
    }
  }
}

export function getValueType(value: JSONValue): ValueType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as ValueType;
}

export function isExpandableType(type: ValueType): boolean {
  return type === "object" || type === "array";
}

export function getValueDisplay(value: JSONValue, type: ValueType): string {
  switch (type) {
    case "object":
      const keys = Object.keys(value as object);
      return `{} (${keys.length} ${keys.length === 1 ? "property" : "properties"})`;
    case "array":
      const array = value as JSONValue[];
      return `[] (${array.length} ${array.length === 1 ? "item" : "items"})`;
    case "string":
      return `"${value}"`;
    default:
      return String(value);
  }
}
