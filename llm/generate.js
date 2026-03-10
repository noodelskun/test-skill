import path from 'path';
import { fileURLToPath } from 'url';
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { qwenPlus } from '../model.js';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const skillsRoot = path.join(projectRoot, '..', 'skills');
const workspaceRoot = path.join(projectRoot, '..', 'workspace');

async function ensureDir(p) {
  try {
    await mkdir(p, { recursive: true });
  } catch {}
}

async function readUtf8(p) {
  return await readFile(p, { encoding: 'utf-8' });
}

async function listSkillDirs() {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

function parseFrontmatter(md) {
  const m = md.startsWith('---') ? md.split('\n') : null;
  if (!m) return { name: '', description: '', keywords: [] };
  let i = 0;
  if (m[i].trim() !== '---') return { name: '', description: '', keywords: [] };
  i++;
  let name = '';
  let description = '';
  const keywords = [];
  let inKeywords = false;
  for (; i < m.length; i++) {
    const line = m[i];
    if (line.trim() === '---') break;
    if (line.startsWith('name:')) name = line.split(':').slice(1).join(':').trim();
    if (line.startsWith('description:')) description = line.split(':').slice(1).join(':').trim();
    if (line.trim().startsWith('keywords:')) {
      inKeywords = true;
      continue;
    }
    if (inKeywords) {
      if (line.trim().startsWith('- ')) {
        keywords.push(line.trim().slice(2).trim());
      } else if (line.includes(':')) {
        inKeywords = false;
      }
    }
  }
  return { name, description, keywords };
}

async function loadSkills() {
  const dirs = await listSkillDirs();
  const skills = [];
  for (const d of dirs) {
    const filePath = path.join(skillsRoot, d, 'SKILL.md');
    try {
      const content = await readUtf8(filePath);
      const meta = parseFrontmatter(content);
      skills.push({ id: d, meta, content });
    } catch {}
  }
  return skills;
}

function selectSkillsByIds(skills, ids) {
  const idSet = new Set(ids.map(x => x.trim()).filter(Boolean));
  return skills.filter(s => idSet.has(s.id));
}

function buildSystemPrompt(selected) {
  const head =
    '你是一个文本生成助手。生成完成后只输出最终HTML，不要解释。以下是可用的技能片段：\n';
  const parts = selected.map(sk => {
    const snippet = sk.content.slice(0, 8000);
    return `【${sk.id}】\n${snippet}`;
  });
  return head + parts.join('\n\n');
}

async function nextFileName(base, dir) {
  const ext = path.extname(base);
  const name = path.basename(base, ext);
  await ensureDir(dir);
  const entries = await readdir(dir).catch(() => []);
  const nums = [];
  for (const e of entries) {
    if (e.startsWith(name) && e.endsWith(ext)) {
      const mid = e.slice(name.length, e.length - ext.length);
      const m = mid.match(/^(\d+)$/);
      if (m) nums.push(Number(m[1]));
      if (mid === '') nums.push(0);
    }
  }
  const n = nums.length === 0 ? 0 : Math.max(...nums) + 1;
  const suffix = n === 0 ? '' : String(n);
  return path.join(dir, `${name}${suffix}${ext}`);
}

async function generate({ skillIds, inputPath, outName } = {}) {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    const all = await loadSkills();
    const names = all.map(s => s.id).join(', ');
    throw new Error(`请通过 skillIds 指定技能，例如: ["html-render"]. 可用技能: ${names}`);
  }
  const resumePath = inputPath ?? path.join(projectRoot, '..', '虚拟人物简历.md');
  const userText = await readUtf8(resumePath);
  const skills = await loadSkills();
  const selected = selectSkillsByIds(skills, skillIds);
  if (selected.length === 0) {
    const names = skills.map(s => s.id).join(', ');
    throw new Error(`未找到指定技能: ${skillIds.join(', ')}。可用技能: ${names}`);
  }
  const systemPrompt = buildSystemPrompt(selected);
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(
      '根据输入内容生成一份HTML简历，结构清晰、排版合理、可直接保存为独立HTML文件。仅输出完整HTML，不要解释。'
    ),
    new HumanMessage(userText),
  ];
  const resp = await qwenPlus.invoke(messages);
  const html = typeof resp?.content === 'string' ? resp.content : String(resp?.content ?? '');
  const outPath = await nextFileName(outName ?? 'resume.html', workspaceRoot);
  await writeFile(outPath, html, { encoding: 'utf-8' });
  return outPath;
}

function parseArgs(argv) {
  const args = { skills: null, input: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skills' && argv[i + 1]) {
      args.skills = argv[++i];
    } else if (a.startsWith('--skills=')) {
      args.skills = a.slice('--skills='.length);
    } else if (a === '--input' && argv[i + 1]) {
      args.input = argv[++i];
    } else if (a.startsWith('--input=')) {
      args.input = a.slice('--input='.length);
    } else if (a === '--out' && argv[i + 1]) {
      args.out = argv[++i];
    } else if (a.startsWith('--out=')) {
      args.out = a.slice('--out='.length);
    }
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { skills, input, out } = parseArgs(process.argv.slice(2));
  const skillIds = (skills ?? '').split(',').map(s => s.trim()).filter(Boolean);
  generate({ skillIds, inputPath: input || undefined, outName: out || undefined }).then(p => {
    console.log(`已生成: ${p}`);
  }).catch(e => {
    console.error(e?.message || e);
    process.exit(1);
  });
}

export { generate };
