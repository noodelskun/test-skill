// tools/skillLoader.js
import { z } from "zod";
import { tool } from "@langchain/langgraph/prebuilt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 动态加载所有skills并返回工具数组
 * @param {Object} options - 配置选项
 * @param {string} [options.skillsDir="./skills"] - skills目录路径
 * @param {string[]} [options.extensions=[".js", ".ts", ".mjs"]] - 支持的文件扩展名
 * @returns {Promise<import("@langchain/langgraph").Tool[]>} 工具数组
 */
export async function loadSkills({
    skillsDir = "./skills",
    extensions = [".js", ".mjs", ".ts"]
} = {}) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const skillsPath = path.resolve(__dirname, skillsDir);
    
    try {
        const files = await fs.readdir(skillsPath);
        const skillFiles = files.filter(file => 
            extensions.some(ext => file.endsWith(ext))
        );
        
        const tools = [];
        
        for (const file of skillFiles) {
            const filePath = path.join(skillsPath, file);
            console.log(`🔄 加载 skill: ${file}`);
            
            try {
                // 动态导入ESM模块
                const module = await import(`file://${filePath}`);
                
                // 支持两种导出格式：单个工具或工具数组
                const exportedTools = module.default || module.tools || [];
                
                if (Array.isArray(exportedTools)) {
                    tools.push(...exportedTools);
                } else if (exportedTools._type === "tool") {
                    tools.push(exportedTools);
                }
                
                console.log(`✅ ${file} 加载成功 (${Array.isArray(exportedTools) ? exportedTools.length : 1} 个工具)`);
                
            } catch (error) {
                console.error(`❌ 加载 ${file} 失败:`, error.message);
            }
        }
        
        console.log(`🎉 总共加载 ${tools.length} 个skills`);
        return tools;
        
    } catch (error) {
        console.error(`❌ skills目录加载失败:`, error.message);
        return [];
    }
}

// 示例：skills目录结构
/*
skills/
├── htmlGenerator.js
├── imageProcessor.js  
└── dataAnalyzer.mjs
*/