export function detectPatterns(nodes: any[], stats: any): void {
  const structureMap = new Map<string, string[]>();

  nodes
    .filter((n) => n.type === "object")
    .forEach((node) => {
      const children = nodes.filter(
        (n) =>
          n.path?.startsWith(node.path + ".") &&
          n.path.split(".").length === node.path!.split(".").length + 1
      );
      const structure = children
        .map((c) => c.name)
        .sort()
        .join(",");

      if (structure) {
        if (!structureMap.has(structure)) {
          structureMap.set(structure, []);
        }
        structureMap.get(structure)!.push(node.path!);
      }
    });

  structureMap.forEach((paths, structure) => {
    if (paths.length > 1) {
      stats.patterns.push({
        name: `Object with keys: ${structure}`,
        occurrences: paths.length,
        paths: paths.slice(0, 5),
      });
    }
  });
}

export function displayStats(panel: HTMLElement, stats: any, nodes: any[]): void {
  const ba = stats.businessAnalytics;
  let html = "";

  if (ba.sensitiveData.size > 0) {
    html += '<div class="stat-group"><h4>Sensitive Data ⚠️</h4>';
    ba.sensitiveData.forEach((type: string, key: string) => {
      const icon = type === "email" ? "📧" : "📱";
      html += `<div class="sensitive-item">${icon} ${key}</div>`;
    });
    html += "</div>";
  }

  html += `
    <div class="stat-item">
      <span class="stat-label">Total Nodes:</span>
      <span class="stat-value">${stats.totalNodes}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Max Depth:</span>
      <span class="stat-value">${stats.maxDepth}</span>
    </div>
    <div class="stat-group">
      <h4>Node Types</h4>
      <div class="stat-item">
        <span class="stat-label">Objects:</span>
        <span class="stat-value">${stats.objectCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Arrays:</span>
        <span class="stat-value">${stats.arrayCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Values:</span>
        <span class="stat-value">${stats.valueCount}</span>
      </div>
    </div>
  `;

  if (stats.typeDistribution.size > 0) {
    html += '<div class="stat-group"><h4>Value Types</h4>';
    stats.typeDistribution.forEach((count: number, type: string) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${type}:</span>
          <span class="stat-value">${count}</span>
        </div>
      `;
    });
    html += "</div>";
  }

  if (stats.arrayLengths.length > 0) {
    const avgLength = stats.arrayLengths.reduce((a: number, b: number) => a + b, 0) / stats.arrayLengths.length;
    const maxLength = Math.max(...stats.arrayLengths);
    html += `
      <div class="stat-group">
        <h4>Array Statistics</h4>
        <div class="stat-item">
          <span class="stat-label">Avg Length:</span>
          <span class="stat-value">${avgLength.toFixed(1)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Max Length:</span>
          <span class="stat-value">${maxLength}</span>
        </div>
      </div>
    `;
  }

  const topKeys = Array.from(stats.keyFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topKeys.length > 0) {
    html += '<div class="stat-group"><h4>Top Keys</h4>';
    topKeys.forEach(([key, count]) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${key}:</span>
          <span class="stat-value">${count}</span>
        </div>
      `;
    });
    html += "</div>";
  }

  if (ba.enumerations.size > 0) {
    html += '<div class="stat-group"><h4>Enumerations</h4>';
    Array.from(ba.enumerations.entries())
      .slice(0, 3)
      .forEach(([key, enumInfo]) => {
        const topValues = Array.from(enumInfo.values.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(
            ([val, count]) =>
              `${JSON.parse(val)} (${Math.round((count / enumInfo.totalCount) * 100)}%)`
          )
          .join(", ");
        html += `
        <div class="enum-item">
          <div class="enum-key">${key}:</div>
          <div class="enum-values">${topValues}</div>
        </div>
      `;
      });
    html += "</div>";
  }

  if (ba.potentialIds.size > 0) {
    html += '<div class="stat-group"><h4>Potential IDs 🔑</h4>';
    Array.from(ba.potentialIds)
      .slice(0, 5)
      .forEach((id: string) => {
        html += `<div class="id-item">${id}</div>`;
      });
    html += "</div>";
  }

  const incompleteFields = Array.from(ba.dataCompleteness.entries())
    .filter(([_, completeness]) => completeness < 100)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  if (incompleteFields.length > 0) {
    html += '<div class="stat-group"><h4>Data Completeness</h4>';
    incompleteFields.forEach(([key, completeness]) => {
      html += `
        <div class="stat-item">
          <span class="stat-label">${key}:</span>
          <span class="stat-value ${completeness < 50 ? "low-completeness" : ""}">${Math.round(completeness)}%</span>
        </div>
      `;
    });
    html += "</div>";
  }

  if (stats.patterns.length > 0) {
    html += '<div class="stat-group"><h4>Patterns Found</h4>';
    stats.patterns.slice(0, 3).forEach((pattern: any) => {
      html += `
        <div class="pattern-item">
          <div class="pattern-name">${pattern.name}</div>
          <div class="pattern-count">${pattern.occurrences} occurrences</div>
        </div>
      `;
    });
    html += "</div>";
  }

  panel.innerHTML = html;
}

export function updateNodeLabels(nodes: any[], mode: string, stats: any): void {
  nodes.forEach((node) => {
    switch (mode) {
      case "keys":
        node.displayLabel = node.name;
        break;

      case "values":
        if (node.type === "value") {
          const valueStr = JSON.stringify(node.value);
          node.displayLabel = valueStr.length > 20 ? valueStr.substring(0, 17) + "..." : valueStr;
        } else if (node.type === "array") {
          node.displayLabel = `Array[${node.arrayLength}]`;
        } else if (node.type === "object") {
          node.displayLabel = `Object{${node.childCount}}`;
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "types":
        if (node.type === "value") {
          node.displayLabel = `${node.name}: ${node.valueType}`;
        } else if (node.type === "array") {
          node.displayLabel = `${node.name}: array[${node.arrayLength}]`;
        } else if (node.type === "object") {
          node.displayLabel = `${node.name}: object{${node.childCount}}`;
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "analytics":
        if (node.type === "value") {
          const keyFreq = stats.keyFrequency.get(node.name) || 0;
          if (keyFreq > 1) {
            node.displayLabel = `${node.name} (×${keyFreq})`;
          } else {
            node.displayLabel = node.name;
          }
        } else if (node.type === "array") {
          const avgLength =
            stats.arrayLengths.reduce((a: number, b: number) => a + b, 0) / stats.arrayLengths.length;
          if (node.arrayLength! > avgLength * 1.5) {
            node.displayLabel = `${node.name} [Large: ${node.arrayLength}]`;
          } else if (node.arrayLength === 0) {
            node.displayLabel = `${node.name} [Empty]`;
          } else {
            node.displayLabel = `${node.name} [${node.arrayLength}]`;
          }
        } else if (node.type === "object") {
          const matchesPattern = stats.patterns.some((p: any) => p.paths.includes(node.path!));
          if (matchesPattern) {
            node.displayLabel = `${node.name} 📊`;
          } else if (node.childCount === 0) {
            node.displayLabel = `${node.name} {}`;
          } else {
            node.displayLabel = node.name;
          }
        } else {
          node.displayLabel = node.name;
        }
        break;

      case "path":
        const pathParts = node.path!.split(".");
        if (pathParts.length > 2) {
          node.displayLabel = `...${pathParts.slice(-2).join(".")}`;
        } else {
          node.displayLabel = node.path!;
        }
        break;

      case "business":
        if (node.type === "value" && node.businessInfo) {
          const info = node.businessInfo;
          if (info.isEnum && info.enumDistribution) {
            node.displayLabel = `${node.name} [${info.enumDistribution}]`;
          } else if (info.isPotentialId) {
            node.displayLabel = `${node.name} 🔑`;
          } else if (info.isSensitive) {
            const icon = info.dataType === "email" ? "📧" : "📱";
            node.displayLabel = `${node.name} ${icon}`;
          } else if (info.isAnomaly) {
            node.displayLabel = `${node.name} ⚠️`;
          } else if (info.completeness !== undefined && info.completeness < 100) {
            node.displayLabel = `${node.name} (${Math.round(info.completeness)}%)`;
          } else {
            node.displayLabel = node.name;
          }
        } else if (node.type === "array") {
          const dist = stats.businessAnalytics.valueDistributions.get(node.name);
          if (dist && dist.uniqueValues === 1) {
            node.displayLabel = `${node.name} [uniform]`;
          } else if (node.arrayLength === 0) {
            node.displayLabel = `${node.name} [empty]`;
          } else {
            node.displayLabel = `${node.name} [${node.arrayLength}]`;
          }
        } else if (node.type === "object") {
          const childKeys = nodes.filter(
            (n) =>
              n.path?.startsWith(node.path + ".") &&
              n.path.split(".").length === node.path!.split(".").length + 1
          );
          const hasId = childKeys.some((n) => stats.businessAnalytics.potentialIds.has(n.name));
          if (hasId) {
            node.displayLabel = `${node.name} 🏷️`;
          } else {
            node.displayLabel = node.name;
          }
        } else {
          node.displayLabel = node.name;
        }
        break;

      default:
        node.displayLabel = node.name;
    }
  });
}

export function analyzeBusinessLogic(data: any, nodes: any[], stats: any): void {
  const valuesByKey = new Map<string, any[]>();
  const keyPaths = new Map<string, string[]>();

  nodes.forEach((node: any) => {
    if (node.type === "value" && node.value !== undefined && node.value !== null) {
      const key = node.name;
      if (!valuesByKey.has(key)) {
        valuesByKey.set(key, []);
        keyPaths.set(key, []);
      }
      valuesByKey.get(key)!.push(node.value);
      keyPaths.get(key)!.push(node.path!);
    }
  });

  valuesByKey.forEach((values, key) => {
    const uniqueValues = new Set(values);
    const valueCount = new Map<any, number>();

    values.forEach((v) => {
      const vStr = JSON.stringify(v);
      valueCount.set(vStr, (valueCount.get(vStr) || 0) + 1);
    });

    if (uniqueValues.size <= 10 && values.length >= 3 && uniqueValues.size < values.length * 0.5) {
      const enumInfo = {
        values: new Map(),
        totalCount: values.length,
        isLikelyEnum: true,
      };

      valueCount.forEach((count, value) => {
        enumInfo.values.set(value, count);
      });

      stats.businessAnalytics.enumerations.set(key, enumInfo);
    }

    if (
      key.toLowerCase().includes("id") ||
      key.toLowerCase().includes("key") ||
      key.toLowerCase().includes("uuid") ||
      key.toLowerCase().includes("code")
    ) {
      if (uniqueValues.size === values.length) {
        stats.businessAnalytics.potentialIds.add(key);
      }
    } else if (uniqueValues.size === values.length && values.length > 5) {
      stats.businessAnalytics.potentialIds.add(key);
    }

    if (typeof values[0] === "string") {
      const sampleValue = values[0];
      if (/^[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(sampleValue)) {
        stats.businessAnalytics.sensitiveData.set(key, "email");
      } else if (/^\+?[1-9]\d{1,14}$/.test(sampleValue.replace(/[\s()-]/g, ""))) {
        stats.businessAnalytics.sensitiveData.set(key, "phone");
      } else if (
        /^\d{4}-\d{2}-\d{2}/.test(sampleValue) ||
        /^\d{2}\/\d{2}\/\d{4}/.test(sampleValue)
      ) {
        stats.businessAnalytics.dateFields.add(key);
      }
    }

    if (typeof values[0] === "number") {
      const numbers = values as number[];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;

      const range = {
        min,
        max,
        avg,
        isLikelyMonetary:
          key.toLowerCase().includes("price") ||
          key.toLowerCase().includes("cost") ||
          key.toLowerCase().includes("amount") ||
          key.toLowerCase().includes("total"),
        isLikelyId: uniqueValues.size === values.length && Number.isInteger(min) && min > 0,
      };

      stats.businessAnalytics.numericRanges.set(key, range);
    }

    const topValues = Array.from(valueCount.entries())
      .map(([value, count]) => ({ value: JSON.parse(value), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    stats.businessAnalytics.valueDistributions.set(key, {
      uniqueValues: uniqueValues.size,
      totalOccurrences: values.length,
      topValues,
    });
  });

  const allObjectPaths = new Set<string>();
  nodes.forEach((node: any) => {
    if (node.type === "object") {
      allObjectPaths.add(node.path!.split(".").slice(0, -1).join("."));
    }
  });

  valuesByKey.forEach((values, key) => {
    const keyOccurrences = keyPaths.get(key)!.length;
    const possibleOccurrences = allObjectPaths.size || 1;
    const completeness = (keyOccurrences / possibleOccurrences) * 100;
    stats.businessAnalytics.dataCompleteness.set(key, Math.min(completeness, 100));
  });

  stats.businessAnalytics.enumerations.forEach((enumInfo: any, key: string) => {
    const values = Array.from(enumInfo.values.entries());
    values.forEach(([value, count]) => {
      if (count === 1 && enumInfo.totalCount > 10) {
        if (!stats.businessAnalytics.anomalies.has(key)) {
          stats.businessAnalytics.anomalies.set(key, []);
        }
        stats.businessAnalytics.anomalies.get(key)!.push(value);
      }
    });
  });

  nodes.forEach((node: any) => {
    if (node.type === "value" && node.name) {
      node.businessInfo = {};

      if (stats.businessAnalytics.enumerations.has(node.name)) {
        node.businessInfo.isEnum = true;
        const enumInfo = stats.businessAnalytics.enumerations.get(node.name)!;
        const valueStr = JSON.stringify(node.value);
        const count = enumInfo.values.get(valueStr) || 0;
        const percentage = Math.round((count / enumInfo.totalCount) * 100);
        node.businessInfo.enumDistribution = `${percentage}%`;
      }

      if (stats.businessAnalytics.potentialIds.has(node.name)) {
        node.businessInfo.isPotentialId = true;
      }

      if (stats.businessAnalytics.dataCompleteness.has(node.name)) {
        node.businessInfo.completeness = stats.businessAnalytics.dataCompleteness.get(node.name);
      }

      if (stats.businessAnalytics.anomalies.has(node.name)) {
        const anomalies = stats.businessAnalytics.anomalies.get(node.name)!;
        if (anomalies.includes(JSON.stringify(node.value))) {
          node.businessInfo.isAnomaly = true;
        }
      }

      if (stats.businessAnalytics.sensitiveData.has(node.name)) {
        node.businessInfo.isSensitive = true;
        node.businessInfo.dataType = stats.businessAnalytics.sensitiveData.get(node.name);
      }
    }
  });
}

export function setupDisplayModeSelector(onChange: (mode: string) => void): void {
  const selector = document.getElementById("nodeDisplayMode") as HTMLSelectElement;
  if (selector) {
    selector.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      onChange(target.value);
    });
  }
}

export function highlightConnections(targetNode: any, allNodes: any, allLinks: any): void {
  allNodes.style("opacity", 0.2);
  allLinks.style("opacity", 0.1);

  allNodes.filter((d: any) => d.id === targetNode.id).style("opacity", 1);

  allLinks
    .filter((d: any) => d.source.id === targetNode.id || d.target.id === targetNode.id)
    .style("opacity", 1)
    .each(function (d: any) {
      allNodes.filter((n: any) => n.id === d.source.id || n.id === d.target.id).style("opacity", 1);
    });
}

export function resetHighlight(allNodes: any, allLinks: any): void {
  allNodes.style("opacity", 1);
  allLinks.style("opacity", 0.6);
}

export function showNodeDetails(panel: HTMLElement, node: any, stats: any): void {
  let html = `
    <div class="detail-item">
      <strong>Name:</strong> ${node.name}
    </div>
    <div class="detail-item">
      <strong>Type:</strong> ${node.type}
    </div>
    <div class="detail-item">
      <strong>Path:</strong> <code>${node.path}</code>
    </div>
    <div class="detail-item">
      <strong>Depth:</strong> ${node.depth}
    </div>
  `;

  if (node.type === "value") {
    html += `
      <div class="detail-item">
        <strong>Value:</strong> <code>${JSON.stringify(node.value)}</code>
      </div>
      <div class="detail-item">
        <strong>Value Type:</strong> ${node.valueType}
      </div>
    `;

    if (node.businessInfo) {
      html += '<div class="detail-group"><h4>Business Analytics</h4>';

      if (node.businessInfo.isEnum) {
        const enumInfo = stats.businessAnalytics.enumerations.get(node.name)!;
        html += `<div class="detail-item"><strong>Enumeration:</strong> ${enumInfo.values.size} unique values</div>`;
        if (node.businessInfo.enumDistribution) {
          html += `<div class="detail-item"><strong>This Value:</strong> ${node.businessInfo.enumDistribution} of occurrences</div>`;
        }
      }

      if (node.businessInfo.isPotentialId) {
        html += `<div class="detail-item"><strong>Potential ID:</strong> All values are unique</div>`;
      }

      if (node.businessInfo.completeness !== undefined) {
        html += `<div class="detail-item"><strong>Completeness:</strong> ${Math.round(node.businessInfo.completeness)}%</div>`;
      }

      if (node.businessInfo.isAnomaly) {
        html += `<div class="detail-item" style="color: #dc2626;"><strong>⚠️ Anomaly:</strong> Rare value in enumeration</div>`;
      }

      if (node.businessInfo.isSensitive) {
        html += `<div class="detail-item" style="color: #dc2626;"><strong>🔒 Sensitive:</strong> ${node.businessInfo.dataType}</div>`;
      }

      html += "</div>";
    }

    if (stats.businessAnalytics.numericRanges.has(node.name)) {
      const range = stats.businessAnalytics.numericRanges.get(node.name)!;
      html += '<div class="detail-group"><h4>Numeric Analysis</h4>';
      html += `<div class="detail-item"><strong>Range:</strong> ${range.min} - ${range.max}</div>`;
      html += `<div class="detail-item"><strong>Average:</strong> ${range.avg.toFixed(2)}</div>`;
      if (range.isLikelyMonetary) {
        html += `<div class="detail-item"><strong>Type:</strong> Likely monetary value 💰</div>`;
      }
      html += "</div>";
    }
  } else if (node.type === "object") {
    html += `
      <div class="detail-item">
        <strong>Properties:</strong> ${node.childCount || 0}
      </div>
    `;
  } else if (node.type === "array") {
    html += `
      <div class="detail-item">
        <strong>Length:</strong> ${node.arrayLength || 0}
      </div>
    `;

    const dist = stats.businessAnalytics.valueDistributions.get(node.name);
    if (dist) {
      html += '<div class="detail-group"><h4>Array Analysis</h4>';
      html += `<div class="detail-item"><strong>Unique Values:</strong> ${dist.uniqueValues}</div>`;
      if (dist.uniqueValues === 1) {
        html += `<div class="detail-item"><strong>Pattern:</strong> All values are identical</div>`;
      }
      html += "</div>";
    }
  }

  const relatedPatterns = stats.patterns.filter((p: any) => p.paths.includes(node.path!));
  if (relatedPatterns.length > 0) {
    html += '<div class="detail-group"><h4>Part of Patterns</h4>';
    relatedPatterns.forEach((pattern: any) => {
      html += `<div class="pattern-reference">${pattern.name}</div>`;
    });
    html += "</div>";
  }

  panel.innerHTML = html;
}