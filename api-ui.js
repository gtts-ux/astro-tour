let apiSettings;
function pythonExample() {
  const endpoint = apiSettings?.endpoint || 'http://127.0.0.1:47831/v1/score';
  const key = apiSettings?.token || 'YOUR_API_KEY';
  return `import json\nfrom urllib.request import Request, urlopen\nfrom urllib.error import HTTPError, URLError\n\nurl = ${JSON.stringify(endpoint)}\napi_key = ${JSON.stringify(key)}\nrequest = Request(url, headers={"Authorization": f"Bearer {api_key}"})\n\ntry:\n    with urlopen(request, timeout=10) as response:\n        data = json.load(response)\n    print(f"Astro score: {data['score']}%")\n    print(f"Clouds: {data['conditions']['cloud_cover_percent']}%")\n    print(f"Partial score: {data['partial']}")\nexcept HTTPError as error:\n    print(f"API error {error.code}: {error.read().decode()}")\nexcept URLError:\n    print("Open Astro Tour and enable its Local API first.")\n`;
}
function showApiSettings(data) {
  apiSettings = data;
  $('apiEndpoint').value = data.endpoint || 'Enable the API to get your endpoint';
  $('apiKey').value = data.token;
  $('toggleApi').textContent = data.enabled ? 'Disable API' : 'Enable API';
  $('apiStatus').textContent = data.error || (data.enabled ? '● Running · local access only · keep Astro Tour open' : '○ Disabled · enable to connect your project');
  $('copyEndpoint').disabled = !data.enabled;
  $('copyPython').disabled = !data.enabled;
  // Show a placeholder in the tutorial; only the explicit Copy Python action includes the key.
  $('pythonExample').textContent = pythonExample().replace(data.token, 'PASTE_YOUR_API_KEY_HERE');
}
async function configureApi(action) {
  $('toggleApi').disabled = true;
  try { showApiSettings(await window.desktop.configureApi(action)); }
  catch { $('apiStatus').textContent = 'Could not change API settings. Please try again.'; }
  finally { $('toggleApi').disabled = false; }
}
$('toggleApi').onclick = () => configureApi(apiSettings?.enabled ? 'disable' : 'enable');
$('rotateApiKey').onclick = () => configureApi('rotate');
$('showApiKey').onclick = () => { const show = $('apiKey').type === 'password'; $('apiKey').type = show ? 'text' : 'password'; $('showApiKey').textContent = show ? 'Hide' : 'Show'; };
function copy(button, value) {
  const label = button.textContent;
  try { window.desktop.copy(value); button.textContent = 'Copied'; setTimeout(() => button.textContent = label, 1500); }
  catch { $('apiStatus').textContent = 'Clipboard unavailable. Select and copy the text manually.'; }
}
$('copyEndpoint').onclick = () => copy($('copyEndpoint'), apiSettings.endpoint);
$('copyApiKey').onclick = () => copy($('copyApiKey'), apiSettings.token);
$('copyPython').onclick = () => copy($('copyPython'), pythonExample());
window.desktop.apiStatus().then(showApiSettings).catch(() => { $('apiStatus').textContent = 'API settings are unavailable.'; });
$('checkUpdates').onclick = async () => {
  $('checkUpdates').disabled = true;
  $('updateStatus').textContent = 'Checking GitHub…';
  $('downloadUpdate').hidden = true;
  try {
    const result = await window.desktop.checkUpdates();
    if (result.error) throw Error(result.error);
    $('updateStatus').textContent = result.available ? `Version ${result.version} is available.` : `You’re up to date · ${result.current}`;
    $('downloadUpdate').hidden = !result.available;
  } catch (e) { $('updateStatus').textContent = `Could not check. ${e.message}`; }
  finally { $('checkUpdates').disabled = false; }
};
$('downloadUpdate').onclick = () => window.desktop.downloadUpdate();
