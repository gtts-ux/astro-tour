const http = require('node:http');
const { timingSafeEqual } = require('node:crypto');

function createLocalApi({ token, version, snapshot, port = 47831 }) {
  const server = http.createServer((req, res) => {
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    };
    // Only local scripts are supported. Browser pages cannot read this endpoint.
    if (req.headers.origin) return send(403, { error: 'Browser origins are not supported. Call this API from your local project.' });
    const expected = Buffer.from(`Bearer ${token}`);
    const supplied = Buffer.from(req.headers.authorization || '');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return send(401, { error: 'Provide your API key as Authorization: Bearer <key>.' });
    if (req.method !== 'GET') return send(405, { error: 'Use GET.' });
    if (req.url === '/v1/health') return send(200, { status: 'ok', version });
    if (req.url !== '/v1/score') return send(404, { error: 'Unknown endpoint. Use /v1/score.' });
    const data = snapshot();
    if (!data || !Number.isFinite(data.score)) return send(503, { error: 'No complete score yet. Choose a location in Astro Tour and wait for its forecast.' });
    send(200, { api_version: 1, app_version: version, ...data });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.maxConnections = 20;
  return {
    start: () => new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve(`http://127.0.0.1:${server.address().port}`);
      });
    }),
    stop: () => new Promise(resolve => {
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}
module.exports = { createLocalApi };
