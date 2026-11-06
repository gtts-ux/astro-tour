const RELEASES = 'https://api.github.com/repos/gtts-ux/astro-tour/releases?per_page=100';
function compareVersions(a, b) {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { const diff = left[i] - right[i]; if (diff) return diff; }
  return 0;
}
function selectUpdate(releases, current, platform, arch) {
  const os = platform === 'darwin' ? 'macos' : platform === 'win32' ? 'windows' : null;
  if (!os) throw Error('Updates are available for macOS and Windows.');
  const candidates = [];
  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const match = /^v(\d+\.\d+\.\d+)-(macos|windows)$/.exec(release.tag_name || '');
    if (!match || match[2] !== os || compareVersions(match[1], current) <= 0) continue;
    const suffix = os === 'macos' ? `-macOS-${arch}.zip` : `-Windows-Setup-${arch}.exe`;
    const asset = (release.assets || []).find(a => a.name?.endsWith(suffix) && a.size > 0);
    if (!asset) continue;
    let url; try { url = new URL(asset.browser_download_url); } catch { continue; }
    if (url.origin !== 'https://github.com' || !url.pathname.startsWith('/gtts-ux/astro-tour/releases/download/')) continue;
    candidates.push({ available: true, version: match[1], current, url: url.href });
  }
  candidates.sort((a, b) => compareVersions(b.version, a.version));
  return candidates[0] || { available: false, current };
}
async function checkForUpdates(current, platform, arch, fetcher = fetch) {
  const response = await fetcher(RELEASES, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Astro-Tour-Update-Check' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error(response.status === 403 || response.status === 429 ? 'GitHub rate limit reached. Try again later.' : `GitHub returned ${response.status}. Try again later.`);
  const releases = await response.json();
  if (!Array.isArray(releases)) throw Error('GitHub returned an invalid release list.');
  return selectUpdate(releases, current, platform, arch);
}
module.exports = { compareVersions, selectUpdate, checkForUpdates };
