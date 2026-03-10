import { HumanMessage } from '@langchain/core/messages';

export const createHtmlMessage = ({text, fileName, skill}) => {
    return new HumanMessage({
        content: `你的任务是将用户输入的文本 ${text} 根据 ${skill} skill 生成html文件，文件名为 ${fileName},生成的文件放在/workspace/目录下`,
    });
}