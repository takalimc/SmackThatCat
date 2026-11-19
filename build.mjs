import { readFile, mkdir, writeFile, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
let html = await readFile(resolve(root,'index.template.html'),'utf8');
for (const scene of ['landing','defeat','return']) html=html.replaceAll('assets/'+scene+'.png','assets/'+scene+'.jpg');
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/index.html'),html);
await cp(resolve(root,'assets'),resolve(root,'dist/assets'),{recursive:true});
