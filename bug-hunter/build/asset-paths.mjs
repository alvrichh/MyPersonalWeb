import { lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const WORLD_FOLDERS = Object.freeze([
  '01-backlog', '02-hotfix-inferno', '03-code-freeze',
  '04-big-ball-of-mud', '05-legacy-jungle', '06-the-arena',
  '07-the-forge', '08-haunted-servers', '09-the-core',
]);

/** Repository organization is not a browser URL. Keep the old asset suffix. */
export function publicAssetPath(relativePath) {
  const parts = relativePath.replaceAll('\\', '/').split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || p.includes(':') || p.includes('\0'))) {
    throw new Error(`Invalid asset path: ${relativePath}`);
  }
  if (parts[0] === 'shared') parts.splice(0, 1);
  else if (parts[0] === 'worlds') {
    if (!WORLD_FOLDERS.includes(parts[1])) throw new Error(`Unknown asset world: ${parts[1]}`);
    const cast = ['original', 'demon', 'viking', 'mud', 'jungle', 'greek', 'robot', 'nightmare', 'core'][WORLD_FOLDERS.indexOf(parts[1])];
    parts.splice(0, 2);
    if (parts[0] === 'scenery') parts[0] = cast;
  } else if (parts[0] === 'special') {
    if (parts[1] === 'fortress') {
      parts.splice(0, 2);
      parts.unshift('fortress');
    } else if (parts[1] === 'secret-shift') parts.splice(0, 2);
    else throw new Error(`Unknown special asset group: ${parts[1]}`);
  }
  // Flat suffixes remain accepted for old fixtures and incremental migrations.
  if (!parts.length) throw new Error(`Asset path has no public suffix: ${relativePath}`);
  return parts.join('/');
}

/** Validate the entire projection before publishing anything. No symlinks or
 * duplicate public URLs: two worlds cannot silently overwrite each other.
 */
export function gameAssetEntries(root) {
  if (!lstatSync(root).isDirectory()) throw new Error('Game assets must be a directory.');
  const entries = [];
  const targets = new Map();
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const source = join(dir, entry.name);
      const repositoryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Asset symlinks are not supported: ${repositoryPath}`);
      if (entry.isDirectory()) { walk(source, repositoryPath); continue; }
      if (!entry.isFile()) throw new Error(`Not a regular asset: ${repositoryPath}`);
      const path = publicAssetPath(repositoryPath);
      const key = path.toLowerCase();
      if (targets.has(key)) throw new Error(`Duplicate public asset ${path}: ${targets.get(key)} and ${repositoryPath}`);
      targets.set(key, repositoryPath);
      entries.push({ source, repositoryPath, path });
    }
  };
  walk(root);
  for (const { path } of entries) {
    const parts = path.toLowerCase().split('/');
    parts.pop();
    while (parts.length) {
      if (targets.has(parts.join('/'))) throw new Error(`Asset file/directory conflict: ${path}`);
      parts.pop();
    }
  }
  return entries;
}
