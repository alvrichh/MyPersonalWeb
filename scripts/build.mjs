import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const binName = isWindows ? 'webpack.cmd' : 'webpack';
const npmBin = isWindows ? 'npm.cmd' : 'npm';
const webpackBin = join(process.cwd(), 'node_modules', '.bin', binName);

const quoteWindowsArg = (value) => `"${String(value).replaceAll('"', '\\"')}"`;

const run = (command, args) => {
  const result = isWindows
    ? spawnSync([command, ...args].map(quoteWindowsArg).join(' '), {
        stdio: 'inherit',
        shell: true,
      })
    : spawnSync(command, args, {
        stdio: 'inherit',
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
