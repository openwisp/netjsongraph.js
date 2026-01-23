/**
 * Webpack plugin to inject Leaflet loader snippet into HTML files
 * Only for echarts-only builds
 */
class InjectLeafletLoaderPlugin {
  constructor(options = {}) {
    this.isEchartsOnly = options.isEchartsOnly || false;
    this.mapExamples = [
      "netjson-clustering.html",
      "netjson-switchGraphMode.html",
      "netjsonmap-appendData.html",
      "netjsonmap-appendData2.html",
      "netjsonmap-indoormap.html",
      "netjsonmap-multipleTiles.html",
      "netjsonmap-nodeTiles.html",
      "netjsonmap-plugins.html",
      "netjsonmap.html",
      "njg-geojson.html",
    ];
  }

  getLeafletLoaderSnippet(hasPlugins = false) {
    return `
      // Dynamic Leaflet loader for echarts-only build
      (function () {
        // Check if Leaflet is already loaded
        if (typeof L !== 'undefined') {
          ${hasPlugins ? "loadLeafletPlugins();" : "initMap();"}
          return;
        }

        // Inject Leaflet CSS
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.8.0/dist/leaflet.css';
        leafletCSS.integrity = 'sha512-hoalWLoI8r4UszCkZ5kL8vayOGVae1oxXe/2A4AO6J9+580uKHDO3JdHb7NzwwzK5xr/Fs0W40kiNHxM9vyTtQ==';
        leafletCSS.crossOrigin = '';
        document.head.appendChild(leafletCSS);

        // Inject Leaflet JS
        const leafletJS = document.createElement('script');
        leafletJS.src = 'https://unpkg.com/leaflet@1.8.0/dist/leaflet.js';
        leafletJS.integrity = 'sha512-BB3hKbKWOc9Ez/TAwyWxNXeoV9c1v6FIeYiBieIWkpLjauysF18NzgR1MBNBXf8/KABdlkX68nAhlwcDFLGPCQ==';
        leafletJS.crossOrigin = '';
        leafletJS.onerror = function() {
          console.error('Failed to load Leaflet from CDN. Please check your internet connection.');
        };
        leafletJS.onload = ${hasPlugins ? "loadLeafletPlugins" : "initMap"};
        document.head.appendChild(leafletJS);
      })();
${
  hasPlugins
    ? `
      function loadLeafletPlugins() {
        // Poll for Leaflet availability
        function waitForLeaflet(callback, maxAttempts = 50) {
          let attempts = 0;
          function check() {
            attempts++;
            if (typeof L !== 'undefined') {
              callback();
            } else if (attempts < maxAttempts) {
              setTimeout(check, 100); // Check every 100ms
            } else {
              console.error('Leaflet (L) is still not available after waiting');
              callback(); // Continue anyway
            }
          }
          check();
        }

        waitForLeaflet(function() {
          // Load plugin CSS files
          const leafletDrawCSS = document.createElement('link');
          leafletDrawCSS.rel = 'stylesheet';
          leafletDrawCSS.href = '../lib/css/leaflet-draw.css';
          document.head.appendChild(leafletDrawCSS);

          const leafletMeasureCSS = document.createElement('link');
          leafletMeasureCSS.rel = 'stylesheet';
          leafletMeasureCSS.href = '../lib/css/leaflet-measure.css';
          document.head.appendChild(leafletMeasureCSS);

          // Create script elements
          const leafletDraw = document.createElement('script');
          leafletDraw.src = '../lib/js/leaflet-draw.js';
          leafletDraw.type = 'text/javascript';

          const leafletMeasure = document.createElement('script');
          leafletMeasure.src = '../lib/js/leaflet-measure.js';
          leafletMeasure.type = 'text/javascript';

          // Wait for both plugins to load before initializing
          let drawLoaded = false;
          let measureLoaded = false;

          leafletDraw.onload = function() {
            drawLoaded = true;
            if (measureLoaded) initMap();
          };

          leafletMeasure.onload = function() {
            measureLoaded = true;
            if (drawLoaded) initMap();
          };

          // Add error handling
          leafletDraw.onerror = function() {
            console.error('Failed to load leaflet-draw.js');
            drawLoaded = true; // Don't block initialization
            if (measureLoaded) initMap();
          };

          leafletMeasure.onerror = function() {
            console.error('Failed to load leaflet-measure.js');
            measureLoaded = true; // Don't block initialization
            if (drawLoaded) initMap();
          };

          // Now append scripts to head - Leaflet should be available
          document.head.appendChild(leafletDraw);
          document.head.appendChild(leafletMeasure);
        });
      }
`
    : ""
}
      function initMap() {`;
  }

  apply(compiler) {
    if (!this.isEchartsOnly) {
      return; // Skip injection for full builds
    }

    compiler.hooks.compilation.tap("InjectLeafletLoaderPlugin", (compilation) => {
      const HtmlWebpackPlugin = compiler.options.plugins
        .map((plugin) => plugin.constructor)
        .find((constructor) => constructor && constructor.name === "HtmlWebpackPlugin");

      if (!HtmlWebpackPlugin) {
        return;
      }

      const hooks = HtmlWebpackPlugin.getHooks(compilation);

      hooks.beforeEmit.tapAsync("InjectLeafletLoaderPlugin", (data, cb) => {
        const {outputName, html: originalHtml} = data;
        const filename = outputName.replace("examples/", "");

        // Only inject for map-related examples
        if (!this.mapExamples.includes(filename)) {
          cb(null, data);
          return;
        }

        let html = originalHtml;

        // Check if this file uses Leaflet plugins (like leaflet-draw, leaflet-measure)
        const hasPlugins = filename === "netjsonmap-plugins.html";

        // Remove hardcoded Leaflet CSS and JS from head (we'll load them dynamically)
        // For plugins file, also remove plugin CSS
        if (hasPlugins) {
          // Remove all leaflet-related CSS including plugins
          const leafletCSSRegex =
            /<link[^>]*(?:leaflet-draw|leaflet-measure|leaflet\.css)[^>]*>/gi;
          html = html.replace(leafletCSSRegex, "");
        } else {
          // Only remove main Leaflet CSS
          const leafletCSSRegex = /<link[^>]*leaflet\.css[^>]*>/gi;
          html = html.replace(leafletCSSRegex, "");
        }

        // Remove main leaflet.js script if present
        const leafletJSRegex = /<script[^>]*leaflet[^>]*>[\s\S]*?<\/script>/gi;
        let prev;
        do {
          prev = html;
          html = html.replace(leafletJSRegex, "");
        } while (html !== prev);

        // For plugin file, remove hardcoded plugin scripts from body (we'll load them dynamically)
        if (hasPlugins) {
          const pluginScripts = [
            /<script[^>]*src="[^"]*leaflet-draw\.js"[^>]*>[\s\S]*?<\/script>/gi,
            /<script[^>]*src="[^"]*leaflet-measure\.js"[^>]*>[\s\S]*?<\/script>/gi,
          ];

          pluginScripts.forEach((regex) => {
            html = html.replace(regex, "");
          });
        }

        // Find the script tag and its content (handles <script>, <script type="text/javascript">, and <script type="module">)
        const scriptRegex =
          /<script(?:\s+type="(?:text\/javascript|module)")?>\s*([\s\S]*?)\s*<\/script>/i;
        const match = html.match(scriptRegex);

        if (match) {
          const originalScript = match[1];
          const loaderSnippet = this.getLeafletLoaderSnippet(hasPlugins);

          // Determine the script type from the original tag
          const scriptTypeMatch = html.match(
            /<script(\s+type="(text\/javascript|module)")?>/i,
          );
          const scriptType =
            scriptTypeMatch && scriptTypeMatch[2]
              ? scriptTypeMatch[2]
              : "text/javascript";

          // Wrap the original script in initMap function and add the loader
          const newScript = `${loaderSnippet}\n${originalScript}\n      }`;

          html = html.replace(
            scriptRegex,
            `<script type="${scriptType}">\n      ${newScript}\n    </script>`,
          );
        }

        data.html = html;
        cb(null, data);
      });
    });
  }
}

module.exports = InjectLeafletLoaderPlugin;
