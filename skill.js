import { qwenPlus,qwenCoderPlus,qwenCoderFlash } from './model.js';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import path from 'path';
import { fileURLToPath } from 'url';

const agent = createDeepAgent({
    model: qwenPlus,
    systemPrompt: `你是一个文本生成助手，你可以使用的skill如下:
    1. web-design-guidelines: 生成符合web设计指南的html文本
    2. pixel-art-css: 生成符合像素艺术风格的css
    3. modern-css: 生成modern风格的css
    
    阅读技能或长文件时，请按以下策略操作，确保拿到完整内容：
    - 优先使用 read_file 分页读取（例如 limit=500），并通过调整 offset 连续读取直到文件末尾
    - 如果工具提示结果过大被截断或被写回文件系统，立即改为按页继续读取原文件
    - 只读取与当前任务相关的部分，减少一次性读取长度，避免再次截断
    `,
    backend: new FilesystemBackend({ rootDir: path.dirname(fileURLToPath(import.meta.url)), virtualMode: true }),
    skills: ['/skills/']
});

const render = async () => {
    const time = new Date().getTime();
    const usageTotals = { prompt: 0, completion: 0, total: 0 };
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
    const result = await agent.stream({
        messages: [
            new HumanMessage({
                content: `读取 虚拟人物简历.md 根据其内容生成一份html简历,不要额外添加任何信息,
                文件命名为test10.html如果已有该文件则test后序号递增,严格按照web设计指南生成,要注意文字大小以及排版合理,使用html-render 技能来指导生成`,
            }),
        ]
    }, { streamMode: 'values', callbacks });
    for await (const chunk of result) {
        for (const message of chunk.messages) {
            console.log('--------------ALL START---------------')
            console.log(message.content);
            console.log('--------------ALL END---------------')
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
}
try {
render();
    
} catch (error) {
    console.error('出错:', error);
}
