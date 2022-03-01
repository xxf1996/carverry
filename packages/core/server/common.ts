import { Low, JSONFile } from 'lowdb';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ProjectDB } from '../typings/server';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, 'db/project.json');
const adpater = new JSONFile<ProjectDB>(file);
export const db = new Low(adpater);
