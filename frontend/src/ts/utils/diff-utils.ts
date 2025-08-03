export function generateDiffView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const diffContainer = document.createElement("div");
  diffContainer.className = "diff-container";

  // Input section for two JSONs
  const inputSection = document.createElement("div");
  inputSection.className = "diff-input-section";

  const leftPanel = createDiffPanel("Left JSON", "left");
  const rightPanel = createDiffPanel("Right JSON", "right");

  inputSection.appendChild(leftPanel);
  inputSection.appendChild(rightPanel);

  // Compare button
  const compareSection = document.createElement("div");
  compareSection.className = "diff-compare-section";

  const compareButton = document.createElement("button");
  compareButton.className = "diff-compare-button";
  compareButton.textContent = "Compare JSONs";

  compareSection.appendChild(compareButton);

  // Results section
  const resultsSection = document.createElement("div");
  resultsSection.className = "diff-results-section";
  resultsSection.style.display = "none";

  // Set initial data if available
  const leftTextarea = leftPanel.querySelector("textarea") as HTMLTextAreaElement;
  if (data) {
    leftTextarea.value = JSON.stringify(data, null, 2);
  }

  // Event handlers
  compareButton.onclick = () => {
    const rightTextarea = rightPanel.querySelector("textarea") as HTMLTextAreaElement;

    try {
      const leftData = JSON.parse(leftTextarea.value || "{}");
      const rightData = JSON.parse(rightTextarea.value || "{}");

      const differences = compareJSON(leftData, rightData);
      displayDifferences(differences, resultsSection);
      resultsSection.style.display = "block";
    } catch (error) {
      alert("Invalid JSON. Please check both inputs.");
    }
  };

  diffContainer.appendChild(inputSection);
  diffContainer.appendChild(compareSection);
  diffContainer.appendChild(resultsSection);

  container.appendChild(diffContainer);
}

function createDiffPanel(title: string, side: string): HTMLElement {
  const panel = document.createElement("div");
  panel.className = `diff-panel diff-panel-${side}`;

  const header = document.createElement("h4");
  header.textContent = title;
  panel.appendChild(header);

  const textarea = document.createElement("textarea");
  textarea.className = "diff-textarea";
  textarea.placeholder = "Paste JSON here...";
  panel.appendChild(textarea);

  const formatButton = document.createElement("button");
  formatButton.className = "diff-format-button";
  formatButton.textContent = "Format";
  formatButton.onclick = () => {
    try {
      const data = JSON.parse(textarea.value);
      textarea.value = JSON.stringify(data, null, 2);
    } catch (error) {
      // Invalid JSON, ignore
    }
  };
  panel.appendChild(formatButton);

  return panel;
}

interface DiffResult {
  path: string;
  type: "added" | "removed" | "modified" | "type-changed";
  leftValue?: any;
  rightValue?: any;
}

function compareJSON(left: any, right: any, path: string = "$"): DiffResult[] {
  const differences: DiffResult[] = [];

  if (left === right) {
    return differences;
  }

  if (typeof left !== typeof right) {
    differences.push({
      path,
      type: "type-changed",
      leftValue: left,
      rightValue: right,
    });
    return differences;
  }

  if (typeof left !== "object" || left === null || right === null) {
    differences.push({
      path,
      type: "modified",
      leftValue: left,
      rightValue: right,
    });
    return differences;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);
    for (let i = 0; i < maxLength; i++) {
      if (i >= left.length) {
        differences.push({
          path: `${path}[${i}]`,
          type: "added",
          rightValue: right[i],
        });
      } else if (i >= right.length) {
        differences.push({
          path: `${path}[${i}]`,
          type: "removed",
          leftValue: left[i],
        });
      } else {
        differences.push(...compareJSON(left[i], right[i], `${path}[${i}]`));
      }
    }
  } else {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

    for (const key of allKeys) {
      const keyPath = `${path}.${key}`;

      if (!(key in left)) {
        differences.push({
          path: keyPath,
          type: "added",
          rightValue: right[key],
        });
      } else if (!(key in right)) {
        differences.push({
          path: keyPath,
          type: "removed",
          leftValue: left[key],
        });
      } else {
        differences.push(...compareJSON(left[key], right[key], keyPath));
      }
    }
  }

  return differences;
}

function displayDifferences(differences: DiffResult[], container: HTMLElement): void {
  container.innerHTML = "";

  if (differences.length === 0) {
    container.innerHTML = '<div class="diff-no-changes">No differences found</div>';
    return;
  }

  const summary = document.createElement("div");
  summary.className = "diff-summary";

  const added = differences.filter((d) => d.type === "added").length;
  const removed = differences.filter((d) => d.type === "removed").length;
  const modified = differences.filter((d) => d.type === "modified").length;
  const typeChanged = differences.filter((d) => d.type === "type-changed").length;

  summary.innerHTML = `
    <h4>Summary</h4>
    <div class="diff-stats">
      <span class="diff-stat diff-added">+${added} added</span>
      <span class="diff-stat diff-removed">-${removed} removed</span>
      <span class="diff-stat diff-modified">~${modified} modified</span>
      <span class="diff-stat diff-type-changed">⚡${typeChanged} type changed</span>
    </div>
  `;

  container.appendChild(summary);

  const diffList = document.createElement("div");
  diffList.className = "diff-list";

  differences.forEach((diff) => {
    const diffItem = document.createElement("div");
    diffItem.className = `diff-item diff-${diff.type}`;

    const pathElement = document.createElement("div");
    pathElement.className = "diff-path";
    pathElement.textContent = diff.path;

    const valuesElement = document.createElement("div");
    valuesElement.className = "diff-values";

    switch (diff.type) {
      case "added":
        valuesElement.innerHTML = `
          <div class="diff-value diff-right">
            <span class="diff-label">Added:</span>
            <pre>${JSON.stringify(diff.rightValue, null, 2)}</pre>
          </div>
        `;
        break;

      case "removed":
        valuesElement.innerHTML = `
          <div class="diff-value diff-left">
            <span class="diff-label">Removed:</span>
            <pre>${JSON.stringify(diff.leftValue, null, 2)}</pre>
          </div>
        `;
        break;

      case "modified":
      case "type-changed":
        valuesElement.innerHTML = `
          <div class="diff-value diff-left">
            <span class="diff-label">Before:</span>
            <pre>${JSON.stringify(diff.leftValue, null, 2)}</pre>
          </div>
          <div class="diff-value diff-right">
            <span class="diff-label">After:</span>
            <pre>${JSON.stringify(diff.rightValue, null, 2)}</pre>
          </div>
        `;
        break;
    }

    diffItem.appendChild(pathElement);
    diffItem.appendChild(valuesElement);
    diffList.appendChild(diffItem);
  });

  container.appendChild(diffList);
}
