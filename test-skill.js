import path from 'path';
import { fileURLToPath } from 'url';
import { createDeepAgent } from "deepagents";
import { readdir, readFile as fsReadFile } from 'fs/promises';
/* 读文件 */
export async function readFileUtf8(filePath) {
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const target = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
    return await fsReadFile(target, { encoding: 'utf-8' });
}

function createFileData(content) {
  const now = new Date().toISOString();
  return {
    content,
    created_at: now,
    modified_at: now,
  };
}

const skillsFiles = {}

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(projectDir, 'skills');

async function listFilesRecursive(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await listFilesRecursive(full);
      results.push(...sub);
    } else {
      results.push(full);
    }
  }
  return results;
}

async function populateSkillsFiles() {
  const files = await listFilesRecursive(skillsDir);
  for (const absPath of files) {
    const content = await fsReadFile(absPath, { encoding: 'utf-8' });
    const rel = path.relative(skillsDir, absPath).split(path.sep).join('/');
    const key = `/skills/${rel}`;
    skillsFiles[key] = createFileData(content);
  }
}
(async() => {
  await populateSkillsFiles();
  console.log(skillsFiles,'ddsas');
})()

// export { skillsFiles };
