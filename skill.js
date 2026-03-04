import { qwenPlus } from './model.js';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import path from 'path';
import { fileURLToPath } from 'url';

const agent = createDeepAgent({
    model: qwenPlus,
    systemPrompt: `你是一个文本生成助手，你可以使用的skill如下:
    1. html-render: 生成html文本
    `,
    backend: new FilesystemBackend({ rootDir: path.dirname(fileURLToPath(import.meta.url)), virtualMode: true }),
    skills: ['/skills/']
});

const render = async () => {
    const result = await agent.stream({
        messages: [
            new HumanMessage({
                content: '使用你的html-render技能帮我生成一段简历html，我要暗色主题的',
            }),
        ]
    }, { streamMode: 'values' });
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
}
try {
render();
    
} catch (error) {
    console.error('出错:', error);
}
