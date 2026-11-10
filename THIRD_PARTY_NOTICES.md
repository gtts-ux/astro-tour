# Sources and third-party notices

- **Electron** — MIT; bundled runtime includes its LICENSE and LICENSES.chromium.html. https://www.electronjs.org/
- **Leaflet** — BSD-2-Clause; bundled package includes its license. https://leafletjs.com/
- **SunCalc** — BSD-2-Clause; bundled package includes its license. https://github.com/mourner/suncalc
- **Open-Meteo** — weather model forecasts and geocoding. Data attribution and terms: https://open-meteo.com/en/terms and https://open-meteo.com/en/docs. Free service is subject to its non-commercial use limits. No API key is embedded in Astro Tour.
- **Esri World Topographic Map** — remote map tiles with provider attribution displayed on the Map. Esri, HERE, Garmin, USGS and OpenStreetMap contributors. https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer
- **David Lorenz Light Pollution Atlas** — remote 2025 modeled artificial zenith-brightness grid, based on annual VIIRS nighttime-light inputs from Earth Observation Group / Colorado School of Mines. https://djlorenz.github.io/astronomy/lp/ . The app requests only the relevant regional tile; the dataset is not redistributed in the release. Encoding and grid layout follow the atlas's published viewer. https://djlorenz.github.io/astronomy/lp/overlay/dark.html

- **Natural Earth** — public-domain country boundaries and land/coastline sampling (1:110m, Admin 0). Bundled GeoJSON sourced from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson . Terms: https://www.naturalearthdata.com/about/terms-of-use/ .

The atlas models zenith brightness, not Bortle class. Astro Tour displays modeled zenith brightness as the source quantity and a separately labeled, approximate Bortle equivalent. That conversion is Astro Tour's heuristic, not an observed Bortle classification or a claim made by the atlas author. See https://djlorenz.github.io/astronomy/lp/bortle.html .

Use of external services is governed by their respective terms. All third-party trademarks and data remain the property of their owners. No telemetry, IP-geolocation service, Google API key or user credential is embedded in the application.
