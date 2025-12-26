/**
 * 模块拆分工具
 * 
 * 用法:
 *   node split-module.js --module <moduleName> --output <outputFile>
 *   node split-module.js --range <startLine>:<endLine> --output <outputFile>
 *   node split-module.js --auto  # 自动拆分所有可识别模块
 * 
 * 示例:
 *   node split-module.js --module initLogger --output modules/logger.js
 *   node split-module.js --range 17150:17250 --output modules/logger.js
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
    module: null,
    range: null,
    output: null,
    auto: false,
    source: path.join(__dirname, '..', 'extension.js')
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--module':
            options.module = args[++i];
            break;
        case '--range':
            options.range = args[++i];
            break;
        case '--output':
            options.output = args[++i];
            break;
        case '--auto':
            options.auto = true;
            break;
        case '--source':
            options.source = args[++i];
            break;
        case '--help':
            console.log(`
模块拆分工具

用法:
  node split-module.js [选项]

选项:
  --module <name>    按模块名拆分 (如 initLogger)
  --range <s:e>      按行范围拆分 (如 100:200)
  --output <file>    输出文件路径
  --source <file>    源文件路径 (默认: extension.js)
  --auto             自动分析并建议拆分
  --help             显示帮助

示例:
  node split-module.js --module initLogger --output modules/logger.js
  node split-module.js --range 17150:17250 --output modules/logger.js
  node split-module.js --auto
`);
            process.exit(0);
    }
}

console.log('='.repeat(60));
console.log('模块拆分工具');
console.log('='.repeat(60));

// 读取源文件
const sourceCode = fs.readFileSync(options.source, 'utf-8');
const lines = sourceCode.split('\n');
console.log(`源文件: ${options.source} (${lines.length} 行)`);

// 解析 AST
console.log('解析 AST...');
const ast = parser.parse(sourceCode, {
    sourceType: 'script',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods']
});

// 收集模块信息
const modules = new Map();

traverse(ast, {
    VariableDeclarator(nodePath) {
        const init = nodePath.node.init;
        
        // 匹配 xxx = __esmModule(() => { ... })
        if (
            t.isCallExpression(init) &&
            t.isIdentifier(init.callee, { name: '__esmModule' })
        ) {
            const name = t.isIdentifier(nodePath.node.id) ? nodePath.node.id.name : null;
            if (name) {
                const loc = nodePath.node.loc;
                modules.set(name, {
                    startLine: loc?.start?.line || 0,
                    endLine: loc?.end?.line || 0,
                    node: nodePath.node
                });
            }
        }
    }
});

// 自动模式：显示所有可拆分的模块
if (options.auto) {
    console.log('\n可拆分的 __esmModule 模块:\n');
    
    const sortedModules = [...modules.entries()].sort((a, b) => a[1].startLine - b[1].startLine);
    
    sortedModules.forEach(([name, info], index) => {
        const size = info.endLine - info.startLine;
        console.log(`${index + 1}. ${name}`);
        console.log(`   行范围: ${info.startLine}-${info.endLine} (${size} 行)`);
    });
    
    console.log('\n建议拆分命令:');
    sortedModules.slice(0, 5).forEach(([name]) => {
        const outputName = name.replace(/^init/, '').toLowerCase();
        console.log(`  node split-module.js --module ${name} --output modules/${outputName}.js`);
    });
    
    process.exit(0);
}

// 按模块名拆分
if (options.module) {
    const moduleInfo = modules.get(options.module);
    
    if (!moduleInfo) {
        console.error(`错误: 找不到模块 "${options.module}"`);
        console.log('\n可用的模块:');
        [...modules.keys()].forEach(name => console.log(`  - ${name}`));
        process.exit(1);
    }
    
    console.log(`\n找到模块: ${options.module}`);
    console.log(`行范围: ${moduleInfo.startLine}-${moduleInfo.endLine}`);
    
    // 扩展范围以包含相关的变量声明和函数
    let startLine = moduleInfo.startLine;
    let endLine = moduleInfo.endLine;
    
    // 向上查找相关的变量声明
    for (let i = startLine - 1; i > 0 && i > startLine - 50; i--) {
        const line = lines[i - 1];
        if (line.match(/^var\s+\w+/) || line.match(/^\s*$/)) {
            startLine = i;
        } else if (line.match(/^function\s+\w+/) || line.match(/^}\s*$/)) {
            break;
        }
    }
    
    // 提取代码
    const extractedCode = lines.slice(startLine - 1, endLine).join('\n');
    
    console.log(`扩展后的行范围: ${startLine}-${endLine}`);
    console.log(`提取的代码长度: ${extractedCode.length} 字符`);
    
    if (options.output) {
        // 生成模块文件
        const moduleName = options.module.replace(/^init/, '');
        const moduleCode = `/**
 * Module: ${moduleName}
 * Description: Auto-extracted from extension.js
 * Line Range: ${startLine}-${endLine}
 * 
 * Auto-generated by split-module.js
 */
'use strict';

// 导入依赖
var { __esmModule, __toESM, __commonJS } = require('./shared-env.js');

// ============== 模块代码 ==============

${extractedCode}

// ============== Exports ==============
module.exports = {
    ${options.module}
};
`;
        
        const outputPath = path.resolve(__dirname, '..', options.output);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, moduleCode);
        
        console.log(`\n✓ 模块已保存到: ${outputPath}`);
        
        // 生成替换代码
        console.log('\n在 extension.js 中添加以下导入:');
        console.log(`var { ${options.module} } = require('./${options.output}');`);
        
        console.log('\n删除原始代码的行范围:');
        console.log(`${startLine}-${endLine}`);
    } else {
        console.log('\n提取的代码预览 (前 30 行):');
        console.log('-'.repeat(60));
        console.log(extractedCode.split('\n').slice(0, 30).join('\n'));
        console.log('-'.repeat(60));
        console.log('\n使用 --output 参数保存到文件');
    }
}

// 按行范围拆分
if (options.range) {
    const [startStr, endStr] = options.range.split(':');
    const startLine = parseInt(startStr, 10);
    const endLine = parseInt(endStr, 10);
    
    if (isNaN(startLine) || isNaN(endLine)) {
        console.error('错误: 无效的行范围格式，应为 start:end');
        process.exit(1);
    }
    
    console.log(`\n提取行范围: ${startLine}-${endLine}`);
    
    const extractedCode = lines.slice(startLine - 1, endLine).join('\n');
    
    console.log(`提取的代码长度: ${extractedCode.length} 字符`);
    
    if (options.output) {
        const moduleCode = `/**
 * Module: custom-extract
 * Description: Auto-extracted from extension.js
 * Line Range: ${startLine}-${endLine}
 * 
 * Auto-generated by split-module.js
 */
'use strict';

// 导入依赖
var { __esmModule, __toESM, __commonJS } = require('./shared-env.js');

// ============== 模块代码 ==============

${extractedCode}

// ============== Exports ==============
// TODO: 添加导出项
module.exports = {
};
`;
        
        const outputPath = path.resolve(__dirname, '..', options.output);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, moduleCode);
        
        console.log(`\n✓ 代码已保存到: ${outputPath}`);
    } else {
        console.log('\n提取的代码预览 (前 30 行):');
        console.log('-'.repeat(60));
        console.log(extractedCode.split('\n').slice(0, 30).join('\n'));
        console.log('-'.repeat(60));
    }
}

if (!options.module && !options.range && !options.auto) {
    console.log('\n请指定 --module、--range 或 --auto 参数');
    console.log('使用 --help 查看帮助');
}



