/**
 * JavaScript/TypeScript 代码美化脚本
 * 使用 prettier 格式化压缩过的 extension.js 文件
 */

const fs = require('fs');
const path = require('path');

// 目标文件路径
const inputFile = "E:/traycer-ai-6/extension/traycer-views/dist/assets/global.js"
const outputFile = inputFile; // 直接覆盖原文件，也可以改成其他路径

async function beautify() {
    console.log('🚀 开始美化代码...');
    console.log(`📂 输入文件: ${inputFile}`);

    // 检查文件是否存在
    if (!fs.existsSync(inputFile)) {
        console.error('❌ 错误: 文件不存在:', inputFile);
        process.exit(1);
    }

    // 读取文件内容
    console.log('📖 读取文件...');
    const code = fs.readFileSync(inputFile, 'utf-8');
    console.log(`📊 原始文件大小: ${(code.length / 1024 / 1024).toFixed(2)} MB`);

    try {
        // 动态导入 prettier (ESM 模块)
        const prettier = await import('prettier');
        
        console.log('✨ 正在格式化代码...');
        
        // 格式化代码
        const formatted = await prettier.format(code, {
            parser: 'babel',
            semi: true,
            singleQuote: true,
            tabWidth: 2,
            useTabs: false,
            trailingComma: 'es5',
            bracketSpacing: true,
            arrowParens: 'avoid',
            printWidth: 100,
        });

        // 写入格式化后的代码
        fs.writeFileSync(outputFile, formatted, 'utf-8');
        
        console.log(`📊 格式化后文件大小: ${(formatted.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`✅ 代码美化完成! 输出文件: ${outputFile}`);
        
    } catch (error) {
        console.error('❌ 格式化失败:', error.message);
        
        // 如果 prettier 不可用，使用简单的格式化方法
        console.log('⚠️ 尝试使用基础格式化方法...');
        const simpleFormatted = simpleBeautify(code);
        fs.writeFileSync(outputFile, simpleFormatted, 'utf-8');
        console.log(`✅ 基础格式化完成! 输出文件: ${outputFile}`);
    }
}

/**
 * 简单的代码格式化函数（备用方案）
 * 当 prettier 不可用时使用
 */
function simpleBeautify(code) {
    let result = code;
    let indent = 0;
    const indentStr = '  ';
    
    // 在特定符号后添加换行
    result = result
        // 在 { 后添加换行
        .replace(/\{(?!\s*\n)/g, '{\n')
        // 在 } 前添加换行
        .replace(/(?<!\n\s*)}/g, '\n}')
        // 在 ; 后添加换行（但不在 for 循环内）
        .replace(/;(?!\s*\n)(?![^(]*\))/g, ';\n')
        // 在 } 后添加换行
        .replace(/}(?!\s*[,;\n\)])/g, '}\n');
    
    // 处理缩进
    const lines = result.split('\n');
    const formattedLines = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // 减少缩进的情况
        if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
            indent = Math.max(0, indent - 1);
        }
        
        formattedLines.push(indentStr.repeat(indent) + line);
        
        // 增加缩进的情况
        const opens = (line.match(/[{[(]/g) || []).length;
        const closes = (line.match(/[}\])]/g) || []).length;
        indent += opens - closes;
        indent = Math.max(0, indent);
    }
    
    return formattedLines.join('\n');
}

// 运行美化
beautify().catch(err => {
    console.error('❌ 运行出错:', err);
    process.exit(1);
});


