import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const sourceDirectory = path.resolve('src');

async function findJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findJavaScriptFiles(fullPath)));
    if (entry.isFile() && entry.name.endsWith('.js')) files.push(fullPath);
  }

  return files;
}

const files = await findJavaScriptFiles(sourceDirectory);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Checked ${files.length} backend source files.`);
