import { JSONValue, JSONObject, JSONArray, TreeNodeData } from './types.js';
import { getValueType, isExpandableType, getValueDisplay } from './json-utils.js';

export function generateTreeView(data: JSONValue, container: HTMLElement): void {
  container.innerHTML = "";
  const rootNode = createTreeNode(data, "root");
  container.appendChild(rootNode);
}

export function createTreeNode(value: JSONValue, key: string, level: number = 0): HTMLElement {
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
    toggle.textContent = "▼";
    toggle.addEventListener("click", () => toggleNode(container, toggle));
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
  valueSpan.textContent = getValueDisplay(value, type);
  header.appendChild(valueSpan);

  container.appendChild(header);

  if (isExpandable) {
    const childContainer = document.createElement("div");
    childContainer.className = "tree-children";

    if (type === "object") {
      Object.entries(value as JSONObject).forEach(([childKey, childValue]) => {
        const childNode = createTreeNode(childValue, childKey, level + 1);
        childContainer.appendChild(childNode);
      });
    } else if (type === "array") {
      (value as JSONArray).forEach((childValue, index) => {
        const childNode = createTreeNode(childValue, `[${index}]`, level + 1);
        childContainer.appendChild(childNode);
      });
    }

    container.appendChild(childContainer);
  }

  return container;
}

export function toggleNode(container: HTMLElement, toggle: HTMLElement): void {
  const children = container.querySelector(".tree-children") as HTMLElement;
  if (children) {
    const isExpanded = children.style.display !== "none";
    children.style.display = isExpanded ? "none" : "block";
    toggle.textContent = isExpanded ? "▶" : "▼";
  }
}