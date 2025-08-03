import { JSONValue, ValueType, ParseResult } from "./types.js";

declare var toastr: any;

export function parseJSON(input: string): ParseResult {
  if (!input.trim()) {
    return { success: false, error: "Please paste some JSON data first" };
  }

  try {
    const parsedJSON = JSON.parse(input);
    return { success: true, data: parsedJSON };
  } catch {
    try {
      const decodedInput = decodeURIComponent(input);
      const parsedJSON = JSON.parse(decodedInput);
      return { success: true, data: parsedJSON };
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
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);
    editor.setValue(formatted);

    // Add pulse animation to format button
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
      formatBtn.classList.add('formatted');
      setTimeout(() => formatBtn.classList.remove('formatted'), 400);
    }

    return { success: true, data: parsed };
  } catch (e: any) {
    toastr.error(`Invalid JSON: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export function compactJSONInEditor(editor: any): ParseResult {
  if (!editor) return { success: false, error: "Editor not initialized" };

  try {
    const content = editor.getValue();
    const parsed = JSON.parse(content);
    const compacted = JSON.stringify(parsed);
    editor.setValue(compacted);

    return { success: true, data: parsed };
  } catch (e: any) {
    toastr.error(`Invalid JSON: ${e.message}`);
    return { success: false, error: e.message };
  }
}

export function clearEditor(editor: any): void {
  if (editor) {
    editor.setValue("");
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
