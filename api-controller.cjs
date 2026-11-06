const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { createLocalApi } = require('./local-api.cjs');
function createApiController(directory, version, port) {
  const file = path.join(directory, 'local-api.json');
  let settings;
  try { settings = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { settings = {}; }
  if (!/^[a-f0-9]{64}$/.test(settings.token || '')) settings = { token: randomBytes(32).toString('hex'), enabled: false };
  let service = null, endpoint = null, snapshot = null, lastError = null;
  const save = () => { fs.mkdirSync(directory, { recursive: true }); fs.writeFileSync(file, JSON.stringify(settings), { mode: 0o600 }); };
  const status = () => ({ enabled: !!service, endpoint: endpoint ? `${endpoint}/v1/score` : null, token: settings.token, error: lastError, version });
  async function enable() {
    if (service) return status();
    const candidate = createLocalApi({ token: settings.token, version, snapshot: () => snapshot, ...(port === undefined ? {} : { port }) });
    try { endpoint = await candidate.start(); service = candidate; settings.enabled = true; lastError = null; save(); }
    catch (e) { lastError = e.code === 'EADDRINUSE' ? 'API port 47831 is already in use. Close the other Astro Tour instance and try again.' : 'The local API could not start. Please try again.'; }
    return status();
  }
  async function disable() { if (service) await service.stop(); service = null; endpoint = null; settings.enabled = false; save(); return status(); }
  let operation = Promise.resolve();
  return {
    initialize: async () => { if (settings.enabled) await enable(); return status(); },
    status,
    configure: action => {
      operation = operation.catch(() => {}).then(async () => {
        if (action === 'enable') return enable();
        if (action === 'disable') return disable();
        if (action === 'rotate') { const enabled = !!service; await disable(); settings.token = randomBytes(32).toString('hex'); save(); return enabled ? enable() : status(); }
        throw Error('Unknown API action.');
      }); return operation;
    },
    publish: data => {
      if (data === null) { snapshot = null; return; }
      if (!data || !Number.isFinite(data.score) || data.score < 0 || data.score > 100 || !Number.isFinite(data.location?.latitude) || !Number.isFinite(data.location?.longitude)) throw Error('Invalid score snapshot.');
      const encoded = JSON.stringify(data);
      if (encoded.length > 16384) throw Error('Score snapshot is too large.');
      snapshot = JSON.parse(encoded);
    },
    stop: () => service?.stop(),
  };
}
module.exports = { createApiController };
