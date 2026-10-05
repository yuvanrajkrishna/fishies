import {appendFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export async function saveCreatureRequest(species: string, why: string) {
  if (process.env.VERCEL) throw new Error('Local request storage is unavailable on Vercel.');
  const directory = join(process.cwd(), 'data');
  await mkdir(directory, {recursive:true, mode:0o700});
  const entry = {id:randomUUID(), species, why, createdAt:new Date().toISOString()};
  await appendFile(join(directory, 'requests.jsonl'), JSON.stringify(entry) + '\n', {encoding:'utf8', mode:0o600});
  return entry.id;
}
