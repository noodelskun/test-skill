import { ChatOpenAI } from '@langchain/openai';

// 建议使用环境变量管理 API Key，避免硬编码
// 如果没有配置环境变量，请将 'YOUR_DASHSCOPE_API_KEY' 替换为你的实际 Key
const apiKey = 'sk-d23a1764eabb4f66ba734c504c8acb15';
if (!apiKey) {
  console.error(
    '❌ Error: API Key is missing. Please set DASHSCOPE_API_KEY in environment variables or in model/qwen.js',
  );
}

export const qwen3Max = new ChatOpenAI({
  model: 'qwen3-max-2026-01-23', // 确认使用的是 qwen3-max 模型
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // 注意: @langchain/openai有些版本使用 configuration.baseURL
  },
  apiKey: apiKey,
  temperature: 0.5,
});
export const qwenPlus = new ChatOpenAI({
  model: 'qwen3.5-35b-a3b',
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // 注意: @langchain/openai有些版本使用 configuration.baseURL
  },
  apiKey: apiKey,
  temperature: 0.5,
});
export const qwenCoderPlus = new ChatOpenAI({
  model: 'qwen-coder-plus',
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // 注意: @langchain/openai有些版本使用 configuration.baseURL
  },
  apiKey: apiKey,
  temperature: 0.5,
});
export const qwenCoderFlash = new ChatOpenAI({
  model: 'qwen-coder-turbo',
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // 注意: @langchain/openai有些版本使用 configuration.baseURL
  },
  apiKey: apiKey,
  temperature: 0.5,
});
