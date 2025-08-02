export function generateChartView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  // Analyze data for chartable content
  const chartableData = analyzeChartableData(data);

  if (chartableData.length === 0) {
    chartContainer.innerHTML = `
      <div class="chart-empty">
        <p>No numeric data suitable for charts found.</p>
        <p>Chart view works best with:</p>
        <ul>
          <li>Arrays of objects with numeric properties</li>
          <li>Objects with numeric values</li>
          <li>Time series data</li>
        </ul>
      </div>
    `;
    container.appendChild(chartContainer);
    return;
  }

  // Chart type selector
  const controls = document.createElement("div");
  controls.className = "chart-controls";

  const dataSelect = document.createElement("select");
  dataSelect.className = "chart-data-select";
  chartableData.forEach((dataset, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = dataset.label;
    dataSelect.appendChild(option);
  });

  const typeSelect = document.createElement("select");
  typeSelect.className = "chart-type-select";
  typeSelect.innerHTML = `
    <option value="bar">Bar Chart</option>
    <option value="line">Line Chart</option>
    <option value="pie">Pie Chart</option>
    <option value="doughnut">Doughnut Chart</option>
    <option value="scatter">Scatter Plot</option>
    <option value="radar">Radar Chart</option>
  `;

  const exportButton = document.createElement("button");
  exportButton.className = "chart-export-button";
  exportButton.textContent = "Export as Image";

  controls.appendChild(dataSelect);
  controls.appendChild(typeSelect);
  controls.appendChild(exportButton);

  // Canvas for chart
  const canvasWrapper = document.createElement("div");
  canvasWrapper.className = "chart-canvas-wrapper";

  const canvas = document.createElement("canvas");
  canvas.id = "json-chart";
  canvasWrapper.appendChild(canvas);

  chartContainer.appendChild(controls);
  chartContainer.appendChild(canvasWrapper);
  container.appendChild(chartContainer);

  // Load Chart.js if not available
  if (typeof (window as any).Chart === "undefined") {
    canvasWrapper.innerHTML =
      '<div style="padding: 20px; text-align: center;">Loading Chart.js library...</div>';
    loadChartJS()
      .then(() => {
        canvasWrapper.innerHTML = "";
        canvasWrapper.appendChild(canvas);
        initializeChart(canvas, chartableData, dataSelect, typeSelect, exportButton);
      })
      .catch((error) => {
        console.error("Failed to load Chart.js:", error);
        canvasWrapper.innerHTML =
          '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Failed to load Chart.js library. Please check your internet connection and refresh.</div>';
      });
  } else {
    initializeChart(canvas, chartableData, dataSelect, typeSelect, exportButton);
  }
}

interface ChartableDataset {
  label: string;
  data: any[];
  type: "numeric" | "categorical" | "timeseries";
  path: string;
  suggestions: string[];
}

function analyzeChartableData(data: any, path: string = "$"): ChartableDataset[] {
  const datasets: ChartableDataset[] = [];

  // If root is array of objects
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
    const numericFields = new Set<string>();
    const allFields = new Set<string>();

    // Find numeric fields
    data.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          allFields.add(key);
          if (typeof value === "number") {
            numericFields.add(key);
          }
        });
      }
    });

    // Create datasets for each numeric field
    numericFields.forEach((field) => {
      const values = data
        .map((item) => ({
          label: item.id || item.name || item.label || data.indexOf(item),
          value: item[field],
        }))
        .filter((item) => item.value !== null && item.value !== undefined);

      if (values.length > 0) {
        datasets.push({
          label: `${field} (${values.length} items)`,
          data: values,
          type: "numeric",
          path: `${path}[*].${field}`,
          suggestions: ["bar", "line", "scatter"],
        });
      }
    });
  }

  // If root is object with numeric values
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const numericEntries = Object.entries(data).filter(([_, value]) => typeof value === "number");

    if (numericEntries.length > 0) {
      datasets.push({
        label: "Root object values",
        data: numericEntries.map(([key, value]) => ({ label: key, value })),
        type: "categorical",
        path,
        suggestions: ["pie", "doughnut", "bar"],
      });
    }
  }

  // Traverse nested structures
  function traverse(obj: any, currentPath: string, parentKey?: string) {
    if (Array.isArray(obj) && obj.length > 0) {
      // Check if it's an array of numbers
      if (obj.every((item) => typeof item === "number")) {
        datasets.push({
          label: parentKey ? `${parentKey} values` : `Array at ${currentPath}`,
          data: obj.map((value, index) => ({ label: `Index ${index}`, value })),
          type: "numeric",
          path: currentPath,
          suggestions: ["line", "bar"],
        });
      }
      // Check if it's an array of objects with numeric fields
      else if (obj.every((item) => typeof item === "object" && item !== null)) {
        const numericFields = new Set<string>();
        const labelFields = new Set<string>();

        // Find numeric and potential label fields
        obj.forEach((item) => {
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === "number") {
              numericFields.add(key);
            } else if (typeof value === "string") {
              labelFields.add(key);
            }
          });
        });

        // Create datasets for each numeric field
        numericFields.forEach((field) => {
          // Find best label field
          let labelField =
            "month" in obj[0]
              ? "month"
              : "name" in obj[0]
                ? "name"
                : "category" in obj[0]
                  ? "category"
                  : "city" in obj[0]
                    ? "city"
                    : "age_group" in obj[0]
                      ? "age_group"
                      : "timestamp" in obj[0]
                        ? "timestamp"
                        : Array.from(labelFields)[0];

          const values = obj
            .map((item, index) => ({
              label:
                labelField && item[labelField] ? String(item[labelField]) : `Item ${index + 1}`,
              value: item[field],
            }))
            .filter((item) => item.value !== null && item.value !== undefined);

          if (values.length > 0) {
            const datasetLabel = parentKey
              ? `${parentKey} - ${field}`
              : `${field} (${values.length} items)`;
            datasets.push({
              label: datasetLabel,
              data: values,
              type: "numeric",
              path: `${currentPath}[*].${field}`,
              suggestions: ["bar", "line", "scatter"],
            });
          }
        });
      }

      obj.forEach((item, index) => {
        traverse(item, `${currentPath}[${index}]`);
      });
    } else if (typeof obj === "object" && obj !== null) {
      // Check for direct numeric values in this object
      const numericEntries = Object.entries(obj).filter(([_, value]) => typeof value === "number");

      if (numericEntries.length > 0 && parentKey) {
        datasets.push({
          label: parentKey,
          data: numericEntries.map(([key, value]) => ({ label: key, value })),
          type: "categorical",
          path: currentPath,
          suggestions: ["pie", "doughnut", "bar"],
        });
      }

      // Continue traversing
      Object.entries(obj).forEach(([key, value]) => {
        traverse(value, `${currentPath}.${key}`, key);
      });
    }
  }

  traverse(data, path);

  return datasets;
}

function loadChartJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).Chart) {
      resolve();
      return;
    }

    // Save the current define function (from Monaco/RequireJS)
    const originalDefine = (window as any).define;

    // Temporarily remove define to force Chart.js to load as global
    (window as any).define = undefined;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      // Restore the original define function
      (window as any).define = originalDefine;

      // Check if Chart.js loaded successfully
      if ((window as any).Chart) {
        resolve();
      } else {
        reject(new Error("Chart.js failed to load"));
      }
    };
    script.onerror = () => {
      // Restore define on error
      (window as any).define = originalDefine;
      reject(new Error("Failed to load Chart.js library"));
    };
    document.head.appendChild(script);
  });
}

function initializeChart(
  canvas: HTMLCanvasElement,
  datasets: ChartableDataset[],
  dataSelect: HTMLSelectElement,
  typeSelect: HTMLSelectElement,
  exportButton: HTMLButtonElement
): void {
  const Chart = (window as any).Chart;

  if (!Chart) {
    console.error("Chart.js is not available");
    canvas.parentElement!.innerHTML =
      '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Error: Chart.js library not loaded properly. Please refresh the page.</div>';
    return;
  }

  let currentChart: any = null;

  const renderChart = () => {
    const selectedDataset = datasets[parseInt(dataSelect.value)];
    const chartType = typeSelect.value;

    if (currentChart) {
      currentChart.destroy();
    }

    const chartData = prepareChartData(selectedDataset, chartType);

    currentChart = new Chart(canvas, {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chartType === "pie" || chartType === "doughnut",
          },
          title: {
            display: true,
            text: selectedDataset.label,
          },
        },
        scales:
          chartType !== "pie" && chartType !== "doughnut" && chartType !== "radar"
            ? {
                y: {
                  beginAtZero: true,
                },
              }
            : undefined,
      },
    });
  };

  // Event handlers
  dataSelect.onchange = renderChart;
  typeSelect.onchange = renderChart;

  exportButton.onclick = () => {
    if (currentChart) {
      const url = currentChart.toBase64Image();
      const a = document.createElement("a");
      a.href = url;
      a.download = "chart.png";
      a.click();
    }
  };

  // Initial render
  renderChart();
}

function prepareChartData(dataset: ChartableDataset, chartType: string): any {
  const labels = dataset.data.map((item) => String(item.label));
  const values = dataset.data.map((item) => item.value);

  const colors = generateColors(dataset.data.length);

  if (chartType === "pie" || chartType === "doughnut") {
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 1,
        },
      ],
    };
  } else if (chartType === "scatter") {
    return {
      datasets: [
        {
          label: dataset.label,
          data: dataset.data.map((item, index) => ({
            x: index,
            y: item.value,
          })),
          backgroundColor: colors[0],
          borderColor: colors[0],
        },
      ],
    };
  } else if (chartType === "radar") {
    return {
      labels,
      datasets: [
        {
          label: dataset.label,
          data: values,
          backgroundColor: colors[0] + "33",
          borderColor: colors[0],
          pointBackgroundColor: colors[0],
        },
      ],
    };
  } else {
    return {
      labels,
      datasets: [
        {
          label: dataset.label,
          data: values,
          backgroundColor: chartType === "line" ? colors[0] + "33" : colors,
          borderColor: chartType === "line" ? colors[0] : colors,
          borderWidth: chartType === "line" ? 2 : 1,
          fill: chartType === "line",
        },
      ],
    };
  }
}

function generateColors(count: number): string[] {
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
  ];

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }

  return result;
}
