export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

export type ValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface TreeNodeData {
  value: JSONValue;
  key: string;
  level: number;
  type: ValueType;
  isExpandable: boolean;
}

export interface DOMElements {
  formattedOutput: HTMLElement;
  treeOutput: HTMLElement;
  formatBtn: HTMLButtonElement;
  compactBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  copyBtn: HTMLButtonElement;
  pasteBtn: HTMLButtonElement;
  tabBtns: NodeListOf<HTMLButtonElement>;
  tabContents: NodeListOf<HTMLElement>;
  pasteHint: HTMLElement;
  editHint: HTMLElement;
}

export interface AppState {
  isFormatted: boolean;
  currentTab: string;
}

export interface ParseResult {
  success: boolean;
  data?: JSONValue;
  error?: string;
}