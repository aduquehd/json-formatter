export function generateMapView(data: any, container: HTMLElement): void {
  container.innerHTML = "";

  const mapContainer = document.createElement("div");
  mapContainer.className = "map-container";

  // Extract geographic data
  const geoData = extractGeoData(data);

  if (geoData.length === 0) {
    mapContainer.innerHTML = `
      <div class="map-empty">
        <p>No geographic data found.</p>
        <p>Map view works best with JSON containing location fields like:</p>
        <ul>
          <li>latitude/longitude, lat/lng, lat/lon</li>
          <li>coordinates array [longitude, latitude]</li>
          <li>address, location, place</li>
          <li>GeoJSON format</li>
        </ul>
      </div>
    `;
    container.appendChild(mapContainer);
    return;
  }

  // Create map element
  const mapElement = document.createElement("div");
  mapElement.id = "json-map";
  mapElement.className = "map-view";
  mapContainer.appendChild(mapElement);

  // Map controls
  const controls = document.createElement("div");
  controls.className = "map-controls";

  const clusterToggle = document.createElement("label");
  clusterToggle.className = "map-toggle";
  clusterToggle.innerHTML = `
    <input type="checkbox" id="clusterToggle" checked>
    <span>Cluster markers</span>
  `;

  const heatmapToggle = document.createElement("label");
  heatmapToggle.className = "map-toggle";
  heatmapToggle.innerHTML = `
    <input type="checkbox" id="heatmapToggle">
    <span>Show heatmap</span>
  `;

  controls.appendChild(clusterToggle);
  controls.appendChild(heatmapToggle);
  mapContainer.appendChild(controls);

  // Info panel
  const infoPanel = document.createElement("div");
  infoPanel.className = "map-info-panel";
  infoPanel.innerHTML = `<p>Found ${geoData.length} location${geoData.length !== 1 ? "s" : ""}</p>`;
  mapContainer.appendChild(infoPanel);

  container.appendChild(mapContainer);

  // Initialize map using Leaflet (if available)
  if (typeof (window as any).L !== "undefined") {
    initializeLeafletMap(mapElement, geoData, controls);
  } else {
    // Fallback: Load Leaflet dynamically
    mapElement.innerHTML = '<div style="padding: 20px; text-align: center;">Loading map...</div>';
    loadLeaflet()
      .then(() => {
        // Add a small delay to ensure everything is loaded
        setTimeout(() => {
          initializeLeafletMap(mapElement, geoData, controls);
        }, 100);
      })
      .catch((error) => {
        console.error("Failed to load map library:", error);
        mapElement.innerHTML =
          '<div style="padding: 20px; text-align: center;">Failed to load map library. Please check your internet connection and refresh.</div>';
      });
  }
}

interface GeoItem {
  lat: number;
  lng: number;
  data: any;
  path: string;
  label?: string;
}

function extractGeoData(data: any, path: string = "$"): GeoItem[] {
  const items: GeoItem[] = [];

  function traverse(obj: any, currentPath: string) {
    if (Array.isArray(obj)) {
      // Check if it's a coordinate pair
      if (obj.length === 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
        // GeoJSON format: [longitude, latitude]
        if (Math.abs(obj[0]) <= 180 && Math.abs(obj[1]) <= 90) {
          items.push({
            lng: obj[0],
            lat: obj[1],
            data: obj,
            path: currentPath,
          });
        }
      }

      obj.forEach((item, index) => {
        traverse(item, `${currentPath}[${index}]`);
      });
    } else if (typeof obj === "object" && obj !== null) {
      // Check for coordinate fields
      let lat: number | null = null;
      let lng: number | null = null;

      // Common patterns
      const latFields = ["latitude", "lat", "Latitude", "Lat", "y"];
      const lngFields = ["longitude", "lng", "lon", "Longitude", "Lng", "Lon", "x"];

      for (const latField of latFields) {
        if (latField in obj && typeof obj[latField] === "number") {
          lat = obj[latField];
          break;
        }
      }

      for (const lngField of lngFields) {
        if (lngField in obj && typeof obj[lngField] === "number") {
          lng = obj[lngField];
          break;
        }
      }

      // Check for nested location object
      if (!lat && !lng && obj.location) {
        const loc = obj.location;
        for (const latField of latFields) {
          if (latField in loc && typeof loc[latField] === "number") {
            lat = loc[latField];
            break;
          }
        }
        for (const lngField of lngFields) {
          if (lngField in loc && typeof loc[lngField] === "number") {
            lng = loc[lngField];
            break;
          }
        }
      }

      // Check for coordinates array
      if (!lat && !lng && obj.coordinates && Array.isArray(obj.coordinates)) {
        if (obj.coordinates.length === 2) {
          lng = obj.coordinates[0];
          lat = obj.coordinates[1];
        }
      }

      if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        const label =
          obj.name || obj.title || obj.label || obj.address || `Location ${items.length + 1}`;
        items.push({
          lat,
          lng,
          data: obj,
          path: currentPath,
          label,
        });
      }

      // Continue traversing
      for (const [key, value] of Object.entries(obj)) {
        traverse(value, `${currentPath}.${key}`);
      }
    }
  }

  traverse(data, path);
  return items;
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loading or loaded
    if ((window as any).L) {
      resolve();
      return;
    }

    // Save the current define function (from Monaco/RequireJS)
    const originalDefine = (window as any).define;

    // Temporarily remove define to force Leaflet to load as global
    (window as any).define = undefined;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // Restore the original define function
      (window as any).define = originalDefine;

      // Load marker cluster plugin CSS
      const clusterCSS = document.createElement("link");
      clusterCSS.rel = "stylesheet";
      clusterCSS.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
      document.head.appendChild(clusterCSS);

      const clusterDefaultCSS = document.createElement("link");
      clusterDefaultCSS.rel = "stylesheet";
      clusterDefaultCSS.href =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
      document.head.appendChild(clusterDefaultCSS);

      // For the cluster plugin, we'll also need to temporarily remove define
      const clusterScript = document.createElement("script");
      clusterScript.src =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";

      // Remove define before loading cluster plugin
      clusterScript.onload = () => {
        (window as any).define = originalDefine;
        resolve();
      };
      clusterScript.onerror = () => {
        // Restore define and continue
        (window as any).define = originalDefine;
        console.warn("Failed to load marker cluster plugin, continuing without it");
        resolve();
      };

      // Remove define again for cluster plugin
      (window as any).define = undefined;
      document.head.appendChild(clusterScript);
    };
    script.onerror = () => {
      // Restore define on error
      (window as any).define = originalDefine;
      reject(new Error("Failed to load Leaflet library"));
    };
    document.head.appendChild(script);
  });
}

function initializeLeafletMap(
  mapElement: HTMLElement,
  geoData: GeoItem[],
  controls: HTMLElement
): void {
  const L = (window as any).L;

  if (!L) {
    console.error("Leaflet library not loaded");
    mapElement.innerHTML =
      '<div style="padding: 20px; text-align: center;">Error loading map library. Please refresh the page.</div>';
    return;
  }

  // Calculate center
  const bounds = geoData.reduce(
    (acc, item) => {
      return {
        minLat: Math.min(acc.minLat, item.lat),
        maxLat: Math.max(acc.maxLat, item.lat),
        minLng: Math.min(acc.minLng, item.lng),
        maxLng: Math.max(acc.maxLng, item.lng),
      };
    },
    {
      minLat: geoData[0].lat,
      maxLat: geoData[0].lat,
      minLng: geoData[0].lng,
      maxLng: geoData[0].lng,
    }
  );

  const center = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  };

  // Initialize map
  const map = L.map(mapElement).setView([center.lat, center.lng], 10);

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Create marker cluster group if available, otherwise use regular layer group
  const markers = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();

  // Add markers
  geoData.forEach((item) => {
    const marker = L.marker([item.lat, item.lng]);

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.className = "map-popup";
    popupContent.innerHTML = `
      <h4>${item.label || "Location"}</h4>
      <p class="map-coords">Lat: ${item.lat.toFixed(6)}, Lng: ${item.lng.toFixed(6)}</p>
      <details>
        <summary>View Data</summary>
        <pre>${JSON.stringify(item.data, null, 2)}</pre>
      </details>
      <p class="map-path">${item.path}</p>
    `;

    marker.bindPopup(popupContent);
    markers.addLayer(marker);
  });

  map.addLayer(markers);

  // Fit bounds
  if (geoData.length > 1) {
    map.fitBounds(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ],
      { padding: [50, 50] }
    );
  }

  // Handle controls
  const clusterToggle = controls.querySelector("#clusterToggle") as HTMLInputElement;
  const heatmapToggle = controls.querySelector("#heatmapToggle") as HTMLInputElement;

  // Store individual markers for toggle functionality
  const individualMarkers: any[] = [];

  if (clusterToggle) {
    clusterToggle.onchange = () => {
      if (clusterToggle.checked && L.markerClusterGroup) {
        // Remove individual markers
        individualMarkers.forEach((m) => map.removeLayer(m));
        individualMarkers.length = 0;
        // Add clustered markers
        map.addLayer(markers);
      } else {
        // Remove clustered markers
        map.removeLayer(markers);
        // Add individual markers
        geoData.forEach((item) => {
          const marker = L.marker([item.lat, item.lng]);

          // Create popup content
          const popupContent = document.createElement("div");
          popupContent.className = "map-popup";
          popupContent.innerHTML = `
            <h4>${item.label || "Location"}</h4>
            <p class="map-coords">Lat: ${item.lat.toFixed(6)}, Lng: ${item.lng.toFixed(6)}</p>
            <details>
              <summary>View Data</summary>
              <pre>${JSON.stringify(item.data, null, 2)}</pre>
            </details>
            <p class="map-path">${item.path}</p>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(map);
          individualMarkers.push(marker);
        });
      }
    };
  }

  // Note: Heatmap would require additional plugin
  if (heatmapToggle) {
    heatmapToggle.onchange = () => {
      if (heatmapToggle.checked) {
        alert("Heatmap visualization requires additional plugins. This is a placeholder.");
      }
    };
  }
}
