import { qwen3Max, qwenPlus, qwenCoderPlus, qwenCoderFlash } from './model.js';
import { createDeepAgent } from 'deepagents';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

import { z } from "zod";
const AIResponseSchema = z.object({
    content: z.string().describe('AI 回复的内容'),
});
const agent = createDeepAgent({
    model: qwen3Max,
    systemPrompt: '',
    responseFormat: AIResponseSchema,
});



const test = async () => {
    const result = await agent.stream({
        messages: [
            new HumanMessage({
                content: '你好',
            }),
        ]
    }, { streamMode: 'values' });
    for await (const chunk of result) {
        // 只输出最新一条
        const lastMessage = chunk.messages[chunk.messages.length - 1];
        if (lastMessage instanceof AIMessage) {
            console.log('---------AI Message----------');
            console.log(lastMessage);
        }
        if (lastMessage?.content) {
            console.log(`代理: ${lastMessage.content}`);
        }

        if (lastMessage?.tool_calls) {
            console.log(`调用工具: ${lastMessage.tool_calls.map(tc => tc.name).join(", ")}`);
        }
        if (chunk.structuredResponse) {
            const finalStructured = chunk.structuredResponse;
            console.log("✅ 结构化结果:", finalStructured);
        }
        // console.log(chunk)
    }
}
test();