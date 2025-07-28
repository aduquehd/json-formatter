import { JSONValue, ValueType, ParseResult } from "./types.js";

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
