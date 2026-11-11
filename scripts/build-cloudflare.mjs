import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist/client', { recursive: true, force: true });
await rm('dist/cloudflare-assets', { recursive: true, force: true });

for (const script of ['build:server', 'build:client']) {
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const declarations = spawnSync('node_modules/.bin/tsc', [
  '--project', 'tsconfig.node.json', '--declaration', '--emitDeclarationOnly',
  '--composite', 'false', '--incremental', 'false',
], { stdio: 'inherit' });
if (declarations.status !== 0) process.exit(declarations.status ?? 1);

// The platform preset emits the HTML under client/, while Workers requires a
// top-level index.html. Build into a separate directory and omit source maps.
const output = 'dist/cloudflare-assets';
await mkdir(output, { recursive: true });
await cp('dist/client/assets', `${output}/assets`, {
  recursive: true,
  filter: (source) => !source.endsWith('.map'),
});
await cp('client/public', output, { recursive: true });
const html = await readFile('dist/client/client/index.html', 'utf8');
// The platform normally fills these server-rendered values. Workers serves a
// static HTML entry, so resolve them here (especially the router basename).
const view = {
  __platform__: '{}', basename: '/', appName: '432 应用统计考研刷题',
  appAvatar: '/favicon.svg', appDescription: '432 应用统计考研真题练习与学习记录',
  environment: 'production',
};
await writeFile(`${output}/index.html`, html.replace(/\{\{\{?(\w+)\}?\}\}/g,
  (_match, key) => view[key] ?? ''));
await writeFile(`${output}/_headers`, `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);
console.log('Cloudflare assets ready.');
