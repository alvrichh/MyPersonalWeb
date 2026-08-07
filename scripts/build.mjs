import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
const binName = isWindows ? 'webpack.cmd' : 'webpack';
const npmBin = isWindows ? 'npm.cmd' : 'npm';
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webpackBin = join(rootDir, 'node_modules', '.bin', binName);
const distDir = join(rootDir, 'dist');
const publicDir = join(rootDir, 'public');
const requiredOutputFiles = [
  'index.html',
  'ai-radar.html',
  'gym.html',
  'planning.html',
];

const quoteWindowsArg = (value) => `"${String(value).replaceAll('"', '\\"')}"`;

const run = (command, args) => {
  const result = isWindows
    ? spawnSync([command, ...args].map(quoteWindowsArg).join(' '), {
        stdio: 'inherit',
        shell: true,
        cwd: rootDir,
      })
    : spawnSync(command, args, {
        stdio: 'inherit',
        cwd: rootDir,
      });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

if (!existsSync(webpackBin)) {
  console.log('webpack not found; installing dependencies with npm ci');
  run(npmBin, ['ci']);
}

run(webpackBin, ['build', '--mode=production']);

if (!existsSync(distDir)) {
  console.error(`Build finished but the expected output directory was not created: ${distDir}`);
  process.exit(1);
}

const missingFiles = requiredOutputFiles.filter((file) => !existsSync(join(distDir, file)));

if (missingFiles.length > 0) {
  console.error(`Build finished but dist is missing required files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Vercel's static builder treats `public` as the canonical output directory for
// projects using the "Other" framework preset. Keep `dist` as the canonical
// local/CI build output, but publish an exact copy from a clean directory so
// Vercel never has to infer or relocate the webpack output.
rmSync(publicDir, { recursive: true, force: true });
cpSync(distDir, publicDir, { recursive: true });

console.log(`Verified local output directory: ${distDir}`);
console.log(`Prepared Vercel output directory: ${publicDir}`);
