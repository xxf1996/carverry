import { Low, JSONFile } from 'lowdb';
import { resolve } from 'path';
import { ProjectDB } from '../typings/server';
import { getDirname } from '../utils/file.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = getDirname(import.meta.url);
const file = resolve(__dirname, 'db/project.json');
const adpater = new JSONFile<ProjectDB>(file);
export const db = new Low(adpater);
