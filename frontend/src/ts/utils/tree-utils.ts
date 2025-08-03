import { JSONValue, JSONObject, JSONArray, TreeNodeData } from "./types.js";
import { getValueType, isExpandableType, getValueDisplay } from "./json-utils.js";

let treeUpdateCallback: ((newData: JSONValue) => void) | null = null;
let currentJsonData: JSONValue | null = null;
let expandedNodes: Set<string> = new Set();
let preserveState: boolean = false;

export function generateTreeView(
  data: JSONValue,
  container: HTMLElement,
  onUpdate?: (newData: JSONValue) => void,
  shouldPreserveState: boolean = false
): void {
  preserveState = shouldPreserveState;
  if (!preserveState) {
    expandedNodes.clear();
  }

  container.innerHTML = "";
  currentJsonData = data;
  treeUpdateCallback = onUpdate || null;
  // For root, we pass an empty path since root itself doesn't have a path
  const rootNode = createTreeNode(data, "root", 0, []);
  container.appendChild(rootNode);
}

export function createTreeNode(
  value: JSONValue,
  key: string,
  level: number = 0,
  path: (string | number)[] = []
): HTMLElement {
  const container = document.createElement("div");
  container.className = "tree-node";
  container.style.marginLeft = `${level * 20}px`;

  const header = document.createElement("div");
  header.className = "tree-node-header";

  const type = getValueType(value);
  const isExpandable = isExpandableType(type);

  if (isExpandable) {
    const toggle = document.createElement("span");
    toggle.className = "tree-toggle";

    // Generate a unique key for this node
    const nodeKey = path.join(".");

    // Determine if node should be expanded
    // Default: expand first two levels and first 3 items of arrays
    const shouldExpandByDefault = () => {
      if (level <= 1) {
        // For arrays at level 0 or 1, only expand first 3 items
        if (type === "array" && key.startsWith("[")) {
          const index = parseInt(key.slice(1, -1));
          return index < 3;
        }
        return true;
      }
      return false;
    };
    
    const shouldExpand = preserveState ? expandedNodes.has(nodeKey) : shouldExpandByDefault();
    toggle.textContent = shouldExpand ? "▼" : "▶";

    // Add to expandedNodes if this node is being expanded by default
    if (shouldExpand && !preserveState) {
      expandedNodes.add(nodeKey);
    }

    // Make the entire header clickable for expand/collapse
    header.style.cursor = "pointer";
    header.addEventListener("click", (e) => {
      // Don't toggle if clicking on editable elements
      const target = e.target as HTMLElement;
      if (target.classList.contains("tree-key") || target.classList.contains("tree-value")) {
        return;
      }
      toggleNode(container, toggle, nodeKey);
    });
    
    header.appendChild(toggle);
  } else {
    const spacer = document.createElement("span");
    spacer.className = "tree-spacer";
    header.appendChild(spacer);
  }

  const keySpan = document.createElement("span");
  keySpan.className = "tree-key";
  if (key && key !== "root") {
    // Don't add quotes for array indices
    if (key.startsWith("[") && key.endsWith("]")) {
      keySpan.textContent = `${key}: `;
    } else {
      keySpan.textContent = `"${key}": `;
      // Make object keys editable (but not array indices)
      keySpan.style.cursor = "pointer";
      keySpan.title = "Click to edit key";
      keySpan.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering value edit
        startEditingKey(keySpan, key, path);
      });
    }
  }
  header.appendChild(keySpan);

  const valueSpan = document.createElement("span");
  valueSpan.className = `tree-value tree-${type}`;
  valueSpan.textContent = getValueDisplay(value, type);

  // Make primitive values editable
  if (!isExpandable) {
    valueSpan.style.cursor = "pointer";
    valueSpan.title = "Click to edit";
    valueSpan.addEventListener("click", () => {
      // The path parameter already represents the full path to this node
      startEditing(valueSpan, value, type, path);
    });
  }

  header.appendChild(valueSpan);

  container.appendChild(header);

  if (isExpandable) {
    const childContainer = document.createElement("div");
    childContainer.className = "tree-children";

    // Check if this node should be collapsed
    const nodeKey = path.join(".");
    const shouldExpandByDefault = () => {
      if (level <= 1) {
        // For arrays at level 0 or 1, only expand first 3 items
        if (type === "array" && key.startsWith("[")) {
          const index = parseInt(key.slice(1, -1));
          return index < 3;
        }
        return true;
      }
      return false;
    };
    
    const shouldExpand = preserveState ? expandedNodes.has(nodeKey) : shouldExpandByDefault();

    if (!shouldExpand) {
      childContainer.style.display = "none";
    }

    if (type === "object") {
      Object.entries(value as JSONObject).forEach(([childKey, childValue]) => {
        // Build the full path to the child node
        const childPath = key === "root" ? [childKey] : [...path, childKey];
        const childNode = createTreeNode(childValue, childKey, level + 1, childPath);
        childContainer.appendChild(childNode);
      });
    } else if (type === "array") {
      (value as JSONArray).forEach((childValue, index) => {
        // Build the full path to the child node
        const childPath = key === "root" ? [index] : [...path, index];
        const childNode = createTreeNode(childValue, `[${index}]`, level + 1, childPath);
        childContainer.appendChild(childNode);
      });
    }

    container.appendChild(childContainer);
  }

  return container;
}

export function toggleNode(container: HTMLElement, toggle: HTMLElement, nodeKey: string): void {
  const children = container.querySelector(".tree-children") as HTMLElement;
  if (children) {
    const isExpanded = children.style.display !== "none";
    children.style.display = isExpanded ? "none" : "block";
    toggle.textContent = isExpanded ? "▶" : "▼";

    // Update the expanded state
    if (isExpanded) {
      expandedNodes.delete(nodeKey);
    } else {
      expandedNodes.add(nodeKey);
    }
  }
}

export function expandAll(container: HTMLElement): void {
  const allNodes = container.querySelectorAll(".tree-node");

  allNodes.forEach((node) => {
    const toggle = node.querySelector(".tree-toggle");
    const children = node.querySelector(".tree-children");

    if (toggle && children) {
      (toggle as HTMLElement).textContent = "▼";
      (children as HTMLElement).style.display = "block";
    }
  });

  // Mark all nodes as expanded - we'll track this differently
  // For now, just set preserveState to true for future updates
  preserveState = true;

  // Re-generate to properly track all expanded nodes
  if (currentJsonData && treeUpdateCallback) {
    const tempContainer = document.createElement("div");
    generateTreeView(currentJsonData, tempContainer, treeUpdateCallback, false);

    // Now all nodes are generated, mark them as expanded
    container.querySelectorAll(".tree-node").forEach((node, index) => {
      const path = getNodePath(node as HTMLElement);
      if (path) {
        expandedNodes.add(path);
      }
    });
  }
}

export function collapseAll(container: HTMLElement): void {
  const allNodes = container.querySelectorAll(".tree-node");

  allNodes.forEach((node) => {
    const toggle = node.querySelector(".tree-toggle");
    const children = node.querySelector(".tree-children");

    if (toggle && children) {
      (toggle as HTMLElement).textContent = "▶";
      (children as HTMLElement).style.display = "none";
    }
  });

  // Clear all expanded nodes
  expandedNodes.clear();
  preserveState = true;
}

// Helper function to get node path from DOM
function getNodePath(node: HTMLElement): string | null {
  const path: string[] = [];
  let current = node;

  while (current && current.classList.contains("tree-node")) {
    const keySpan = current.querySelector(".tree-key");
    if (keySpan) {
      const text = keySpan.textContent || "";
      const key = text.replace(/[":\s\[\]]/g, "");
      if (key && key !== "root") {
        path.unshift(key);
      }
    }
    current = current.parentElement as HTMLElement;
  }

  return path.length > 0 ? path.join(".") : null;
}

function startEditing(
  valueSpan: HTMLElement,
  currentValue: JSONValue,
  type: string,
  path: (string | number)[]
): void {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tree-edit-input";
  input.value = type === "string" ? String(currentValue) : JSON.stringify(currentValue);

  // Set width based on content
  const textWidth = Math.max(100, valueSpan.offsetWidth + 20);
  input.style.width = `${textWidth}px`;

  // Replace span with input
  const parent = valueSpan.parentNode!;
  parent.replaceChild(input, valueSpan);
  input.focus();
  input.select();

  let isFinishing = false;

  function finishEditing(save: boolean): void {
    if (isFinishing) return;
    isFinishing = true;

    if (save) {
      const newValue = parseInputValue(input.value, type);
      if (newValue !== undefined) {
        updateJsonValue(path, newValue);
        const newType = getValueType(newValue);
        valueSpan.textContent = getValueDisplay(newValue, newType);
        valueSpan.className = `tree-value tree-${newType}`;
      }
    }

    if (parent && input.parentNode === parent) {
      parent.replaceChild(valueSpan, input);
    }
  }

  input.addEventListener("blur", () => {
    // Small delay to prevent conflicts with other events
    setTimeout(() => finishEditing(true), 0);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur(); // This will trigger the blur event
    } else if (e.key === "Escape") {
      e.preventDefault();
      finishEditing(false);
    }
  });
}

function parseInputValue(inputValue: string, originalType: string): JSONValue | undefined {
  const trimmed = inputValue.trim();

  // Handle empty input
  if (trimmed === "") {
    return originalType === "string" ? "" : null;
  }

  // Try to parse as JSON first
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // Check if it's a number
  if (!isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed);
  }

  // Try to parse as JSON (for objects/arrays)
  try {
    const parsed = JSON.parse(trimmed);
    return parsed;
  } catch {
    // If all else fails, treat as string
    return trimmed;
  }
}

function updateJsonValue(path: (string | number)[], newValue: JSONValue): void {
  if (!currentJsonData) {
    return;
  }

  if (path.length === 0) {
    // Updating root value
    currentJsonData = newValue;
    if (treeUpdateCallback) {
      treeUpdateCallback(newValue);
    }
    return;
  }

  // Create a deep copy of the current data
  const newData = JSON.parse(JSON.stringify(currentJsonData));

  // Navigate to the parent of the value to update
  let current: any = newData;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    current = current[key];
    if (current === undefined) {
      return;
    }
  }

  // Update the value
  const lastKey = path[path.length - 1];
  current[lastKey] = newValue;

  currentJsonData = newData;
  if (treeUpdateCallback) {
    treeUpdateCallback(newData);
  }
}

function startEditingKey(
  keySpan: HTMLElement,
  currentKey: string,
  path: (string | number)[]
): void {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "tree-edit-input tree-edit-key";
  input.value = currentKey;

  // Set width based on content
  const textWidth = Math.max(80, keySpan.offsetWidth + 20);
  input.style.width = `${textWidth}px`;

  // Store the original text content
  const originalText = keySpan.textContent;

  // Replace span content with input
  keySpan.textContent = "";
  keySpan.appendChild(input);
  input.focus();
  input.select();

  let isFinishing = false;

  function finishEditing(save: boolean): void {
    if (isFinishing) return;
    isFinishing = true;

    if (save && input.value.trim() && input.value !== currentKey) {
      const newKey = input.value.trim();
      if (renameKey(path, currentKey, newKey)) {
        keySpan.textContent = `"${newKey}": `;
      } else {
        // Restore original if rename failed
        keySpan.textContent = originalText;
      }
    } else {
      // Restore original text
      keySpan.textContent = originalText;
    }
  }

  input.addEventListener("blur", () => {
    setTimeout(() => finishEditing(true), 0);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      finishEditing(false);
    }
  });

  input.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

function renameKey(path: (string | number)[], oldKey: string, newKey: string): boolean {
  if (!currentJsonData || oldKey === newKey) return false;

  // Create a deep copy of the current data
  const newData = JSON.parse(JSON.stringify(currentJsonData));

  // Navigate to the parent object that contains the key to rename
  let parent: any = newData;

  // The path contains the full path to the current node
  // We need to go to its parent, so we exclude the last element
  const parentPath = path.slice(0, -1);

  for (const key of parentPath) {
    parent = parent[key];
    if (parent === undefined) {
      return false;
    }
  }

  // Check if parent is an object and has the old key
  if (typeof parent !== "object" || parent === null || Array.isArray(parent)) {
    return false;
  }

  // Check if new key already exists
  if (newKey in parent && newKey !== oldKey) {
    alert(`Key "${newKey}" already exists in this object`);
    return false;
  }

  // Check if the old key exists
  if (!(oldKey in parent)) {
    return false;
  }

  // Rename the key by creating a new object with the same order
  const newParent: any = {};
  for (const key in parent) {
    if (key === oldKey) {
      newParent[newKey] = parent[key];
    } else {
      newParent[key] = parent[key];
    }
  }

  // Update the parent in the data structure
  if (parentPath.length === 0) {
    // We're at the root level
    currentJsonData = newParent;
  } else {
    // Navigate to the parent and update it
    let current: any = newData;
    for (let i = 0; i < parentPath.length - 1; i++) {
      current = current[parentPath[i]];
    }
    current[parentPath[parentPath.length - 1]] = newParent;
    currentJsonData = newData;
  }

  if (treeUpdateCallback) {
    treeUpdateCallback(currentJsonData);
  }

  return true;
}
