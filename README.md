# Astro Tour

A desktop astrophotography planner for macOS and Windows. Find your observing location, read the sky, and plan your next imaging session.

## Download

| Platform | Release | Downloads |
| --- | --- | --- |
| macOS | [macOS release](https://github.com/gtts-ux/astro-tour/releases/tag/v1.3.0-macos) | Intel (x64) and Apple Silicon (arm64) ZIP archives |
| Windows 10/11 | [Windows release](https://github.com/gtts-ux/astro-tour/releases/tag/v1.3.0-windows) | x64 installer EXE and portable ZIP |

**Mac:** unzip and move Astro Tour.app to Applications. The app is locally signed but not Apple notarized; macOS may require **System Settings → Privacy & Security → Open Anyway** on first launch.

**Windows:** run the Setup EXE, or extract the entire portable ZIP and launch Astro Tour.exe. The installer does not require administrator privileges. This release is not Authenticode-signed; Windows may show an unrecognized-publisher notification.

## Features

- Seven-day hourly weather: total / low / mid / high clouds, temperature, dew point, humidity, wind, visibility, rain and pressure.
- Device location with explicit consent, a city / coordinates search, a separate interactive Map and locally saved places.
- Automatic modeled sky brightness from the VIIRS 2025 atlas, with a separately labeled approximate Bortle equivalent.
- Moon illumination and altitude; Sun altitude and astronomical darkness.
- A 0–100 deep-sky imaging score with individual condition cards.
- A live clock with seconds, an hourly time slider, a date picker and **Back to now**.
- Day, Night and red Astro themes. English interface.
- Local API with a copyable endpoint, Bearer key and a ready-to-run Python example.
- A small **Check for updates** button that finds the newest compatible GitHub download.

## Location and privacy

Click **Use my location**. On macOS, allow **Astro Tour Location**, the bundled native helper with its own system identity. On Windows, enable Location services and desktop-app access in **Settings → Privacy & security → Location**. No privacy settings are changed by the application. A computer may need Wi-Fi enabled for positioning; location is not guaranteed on every device. Search or select a point on the Map if access is denied or unavailable.

Coordinates are sent to Open-Meteo for the forecast. The relevant regional sky-brightness tile is requested from David Lorenz's atlas. Map tiles are requested from Esri. Saved locations and theme preferences stay on your computer. There is no IP-location fallback or app telemetry.

The header shows device time. The planner uses the selected observing location's IANA time zone. Live mode follows the current time; moving the slider enters forecast preview. **Weather is hourly, not measured every second.**

## Sky brightness and score

The atlas models artificial zenith brightness; it is **not a Bortle classification or a live measurement**. Astro Tour shows brightness in mag/arcsec² and an approximate Bortle equivalent derived from it. That heuristic cannot represent horizon light domes or subjective visual conditions. Atlas coverage is 65°S–75°N. If the lookup fails or is outside that range, the score explicitly excludes light pollution.

Score weights: clouds 40%, Moon 15%, sky darkness 15%, humidity 10%, wind 10%, visibility 10%. Missing sky brightness produces a partial score with normalized remaining weights. Daylight caps the score at 5%; Sun above −12° at 20%; above −18° at 55%. Rain or ≥95% cloud cover caps it at 10%; ≥80% clouds at 25%. The score is a planning heuristic for deep-sky objects, not a success probability or astronomical-seeing forecast.

Data sources and interpretation: [Open-Meteo](https://open-meteo.com/en/docs), [David Lorenz atlas](https://djlorenz.github.io/astronomy/lp/), [zenith brightness vs Bortle](https://djlorenz.github.io/astronomy/lp/bortle.html), [SunCalc](https://github.com/mourner/suncalc). Full attribution: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Local API and Python

Open the **API** tab, click **Enable API**, then load an observing location in the planner. Click **Copy Python** for a working example with your endpoint and key already filled in. Save it as `astro_score.py` and run `python astro_score.py`. It uses only Python's standard library.

```python
import json
from urllib.request import Request, urlopen

request = Request(
    "http://127.0.0.1:47831/v1/score",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)
with urlopen(request, timeout=10) as response:
    data = json.load(response)
print(f"Astro score: {data['score']}%")
```

Astro Tour must remain open. `GET /v1/score` returns the same selected location, date/hour and score as the planner, plus conditions, score components, `partial`, `selected_time`, `weather_time` and app version. Moving the planner's slider changes the result. `GET /v1/health` reports version/status. Both routes require `Authorization: Bearer YOUR_API_KEY`.

The API is off until enabled, listens only on `127.0.0.1:47831`, and rejects browser-origin requests. HTTP 401 means an invalid/missing key; 503 means no complete score is loaded yet. Use **New key** to revoke the previous key, or **Disable API** to stop the service. Its key and enabled preference are stored locally in the app's user-data folder. Do not commit the generated Python example containing your key to a public repository. This is a local API, not a hosted cloud service.

**Check for updates** queries public GitHub releases only when clicked, filters by operating system and processor architecture, and offers the matching download. Installation is manual. No-update, update-available and connection-error states are shown separately.

## Development

Requires Node.js 22+ and npm. macOS native builds need Xcode Command Line Tools. Windows builds need .NET Framework's C# compiler (included on GitHub's Windows runner).

```sh
npm ci
node node_modules/electron/install.js
npm test
npm start
```

```sh
# macOS: compiles the helper, packages for the host architecture, locally signs
npm run build:mac
# Packaged application smoke test: set ASTRO_EXECUTABLE to its executable path
npm run test:desktop
```

```powershell
# Windows PowerShell: compile the native provider and build installer + ZIP
& "$env:WINDIR/Microsoft.NET/Framework64/v4.0.30319/csc.exe" /nologo /target:exe /platform:x64 /reference:System.Device.dll /out:native/AstroTourLocation.exe native/Location.Windows.cs
npm run build:win
```

For development location on macOS, build the app and test its bundled helper. `npm start` uses the development helper if one has been compiled; OS authorization is most reliable with the packaged app identity.

## Release builds

Two independent GitHub Actions workflows build from platform tags: `v1.3.0-macos` and `v1.3.0-windows`. macOS runs Intel and Apple Silicon builds; Windows builds an x64 per-user NSIS installer and portable archive. Every packaged app is smoke-tested before release publication. Artifacts include SHA-256 checksums. Smoke tests exercise location consent / denial / success with fixture data and validate the actual bundled native executable's diagnostics. Real-device Windows location accuracy depends on hardware and OS permissions.
