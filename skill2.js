import { createDeepAgent, CompositeBackend, StateBackend, StoreBackend, FilesystemBackend } from 'deepagents';
import { qwen3Max } from './model.js';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { MemorySaver, Command } from '@langchain/langgraph';
import { InMemoryStore } from '@langchain/langgraph-checkpoint';
import z from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile as fsReadFile, readdir as fsReaddir, stat as fsStat } from 'fs/promises';

export async function readFileUtf8(filePath) {
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const target = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
    return await fsReadFile(target, { encoding: 'utf-8' });
}

async function loadSkillFiles() {
    const baseDir = path.dirname(fileURLToPath(import.meta.url));
    const skillsDir = path.join(baseDir, 'skills');
    const entries = await fsReaddir(skillsDir);
    const files = {};
    for (const entry of entries) {
        const entryPath = path.join(skillsDir, entry);
        const s = await fsStat(entryPath);
        if (!s.isDirectory()) continue;
        const skillMdPath = path.join(entryPath, 'SKILL.md');
        try {
            const content = await fsReadFile(skillMdPath, { encoding: 'utf-8' });
            const virtPath = `/skills/${entry}/SKILL.md`;
            const now = new Date().toISOString();
            files[virtPath] = {
                content: content.split('\n'),
                created_at: now,
                modified_at: now,
            };
        } catch {}
    }
    return files;
}

const agent = createDeepAgent({
    model: qwen3Max,
    systemPrompt: `
    你是一个文本生成助手
    你可以使用的skill如下:
    1. web-design-guidelines: 生成符合web设计指南的html文本
    2. pixel-art-css: 生成符合像素艺术风格的css
    3. modern-css: 生成modern风格的css
    4. html-render: 生成html文件

    生成任务完成后不要进行解释，不需要进行概况总结，直接结束任务，只执行用户输入的任务，不进行任何解释。
    
    阅读技能或长文件时，请按以下策略操作，确保拿到完整内容：
    - 优先使用 read_file 分页读取（例如 limit=500），并通过调整 offset 连续读取直到文件末尾
    - 如果工具提示结果过大被截断或被写回文件系统，立即改为按页继续读取原文件
    - 只读取与当前任务相关的部分，减少一次性读取长度，避免再次截断
    `,
    backend: (config) => {
        const projectRoot = path.dirname(fileURLToPath(import.meta.url));
        const workspaceRoot = path.join(projectRoot, 'workspace');
        return new CompositeBackend(
            new StateBackend(config),
            {
                "/workspace/": new FilesystemBackend({
                    rootDir: workspaceRoot,
                    virtualMode: true,
                }),
                "/memories/": new StoreBackend(config),
            }
        );
    },
    store: new InMemoryStore(),
    checkpointer: new MemorySaver(),
    skills: ['/skills/'],
});

const agentRunner = agent.withConfig({ recursionLimit: 100 });

const render = async () => {
    const time = new Date().getTime();
    const usageTotals = { prompt: 0, completion: 0, total: 0 };
    const threadId = `skill2-run-${Date.now()}`;
    const callbacks = [{
        handleLLMEnd: async (output) => {
            const u = output?.llmOutput?.tokenUsage || output?.llmOutput?.usage || {};
            const p = u?.promptTokens ?? u?.prompt_tokens ?? 0;
            const c = u?.completionTokens ?? u?.completion_tokens ?? 0;
            const t = u?.totalTokens ?? u?.total_tokens ?? (p + c);
            usageTotals.prompt += p;
            usageTotals.completion += c;
            usageTotals.total += t;
        }
    }];
    const resume = await readFileUtf8('虚拟人物简历.md');
    const skillsFiles = await loadSkillFiles();
    const seedCommand = new Command({ update: { files: skillsFiles } });
    await agent.invoke(seedCommand, { configurable: { thread_id: threadId } });
    const result = await agent.stream({
        messages: [
            new HumanMessage({
                content: `你的任务是将用户输入的文本 ${resume} 根据 html-render skill 生成html文件，文件名为 test15.html,生成的文件放在/workspace/目录下`,
            }),
        ],
    }, {
        streamMode: 'values',
        callbacks,
        configurable: { thread_id: threadId }
    });
    for await (const chunk of result) {
        for (const message of chunk.messages) {
            console.log('--------------ALL START---------------');
            console.log(message.content);
            console.log('--------------ALL END---------------');
        }
        const lastMessage = chunk.messages[chunk.messages.length - 1];
        if (lastMessage instanceof AIMessage) {
            console.log('---------AI Message----------');
            console.log(lastMessage);
        }
        if (lastMessage instanceof ToolMessage) {
            console.log('---------Tool Message----------');
            console.log(lastMessage);
        }
        if (lastMessage?.content) {
            console.log(`代理: ${lastMessage.content}`);
        }
    }
    const time2 = new Date().getTime();
    console.log(`耗时: ${time2 - time}ms`);
    console.log(`Token 消耗: 输入 ${usageTotals.prompt} + 输出 ${usageTotals.completion} = 总计 ${usageTotals.total}`);
};
try {
    render();
} catch (error) {
    console.error('出错:', error);
}
