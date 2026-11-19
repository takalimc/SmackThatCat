import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
let html = await readFile(resolve(root, 'index.template.html'), 'utf8');
const references = new Set(html.match(/assets\/[\w]+\.(?:png|wav)/g));
assert.equal(references.size, 18);
for (const path of references) {
  const asset = await readFile(resolve(root, 'original-' + path.split('/')[1]));
  const mime = path.endsWith('.png') ? 'image/png' : 'audio/wav';
  html = html.replaceAll(path, 'data:' + mime + ';base64,' + asset.toString('base64'));
}
const expected = (await readFile(resolve(root, 'release.sha256'), 'utf8')).trim();
assert.equal(createHash('sha256').update(html).digest('hex'), expected, 'The build differs from the verified v0.6.6 release.');
const output = resolve(root, 'dist/index.html');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
