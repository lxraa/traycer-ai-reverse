/**
 * 模块分析工具
 * 
 * 功能：
 * 1. 识别所有 __esmModule 定义的模块
 * 2. 分析模块间的依赖关系
 * 3. 生成依赖图
 * 4. 建议拆分顺序
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

// 目标文件
const targetFile = process.argv[2] || path.join(__dirname, '..', 'extension.js');

console.log('='.repeat(60));
console.log('模块分析工具');
console.log('='.repeat(60));
console.log(`分析文件: ${targetFile}\n`);

// 读取文件
const code = fs.readFileSync(targetFile, 'utf-8');

console.log('解析 AST...');
const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods']
});

// 收集数据
const esmModules = new Map(); // name -> { line, deps, code }
const classes = new Map();     // name -> { line, methods }
const topLevelFunctions = [];  // { name, line, size }

// 第一遍：收集所有 __esmModule 定义
traverse(ast, {
    VariableDeclarator(nodePath) {
        const init = nodePath.node.init;
        
        // 匹配 xxx = __esmModule(() => { ... })
        if (
            t.isCallExpression(init) &&
            t.isIdentifier(init.callee, { name: '__esmModule' }) &&
            init.arguments.length > 0 &&
            t.isArrowFunctionExpression(init.arguments[0])
        ) {
            const name = t.isIdentifier(nodePath.node.id) ? nodePath.node.id.name : null;
            if (name) {
                const loc = nodePath.node.loc;
                const body = init.arguments[0].body;
                
                // 提取依赖（调用的其他 init 函数）
                const deps = [];
                if (t.isBlockStatement(body)) {
                    body.body.forEach(stmt => {
                        if (t.isExpressionStatement(stmt) && t.isCallExpression(stmt.expression)) {
                            const callee = stmt.expression.callee;
                            if (t.isIdentifier(callee) && callee.name.startsWith('init')) {
                                deps.push(callee.name);
                            }
                        }
                    });
                }
                
                esmModules.set(name, {
                    line: loc?.start?.line || 0,
                    deps,
                    endLine: loc?.end?.line || 0
                });
            }
        }
    },
    
    // 收集类定义
    ClassDeclaration(nodePath) {
        const name = nodePath.node.id?.name;
        if (name) {
            const methods = nodePath.node.body.body
                .filter(m => t.isClassMethod(m))
                .map(m => m.key?.name || '(anonymous)');
            classes.set(name, {
                line: nodePath.node.loc?.start?.line || 0,
                methods
            });
        }
    },
    
    // var Xxx = class { ... }
    VariableDeclarator(nodePath) {
        if (t.isClassExpression(nodePath.node.init)) {
            const name = t.isIdentifier(nodePath.node.id) ? nodePath.node.id.name : null;
            if (name && !classes.has(name)) {
                const classExpr = nodePath.node.init;
                const methods = classExpr.body.body
                    .filter(m => t.isClassMethod(m))
                    .map(m => m.key?.name || '(anonymous)');
                classes.set(name, {
                    line: nodePath.node.loc?.start?.line || 0,
                    methods
                });
            }
        }
    }
});

// 收集顶级函数
traverse(ast, {
    FunctionDeclaration(nodePath) {
        if (nodePath.parent.type === 'Program') {
            const name = nodePath.node.id?.name || '(anonymous)';
            const loc = nodePath.node.loc;
            topLevelFunctions.push({
                name,
                line: loc?.start?.line || 0,
                endLine: loc?.end?.line || 0,
                size: (loc?.end?.line || 0) - (loc?.start?.line || 0)
            });
        }
    }
});

// 输出分析结果
console.log('\n' + '='.repeat(60));
console.log('__esmModule 模块列表');
console.log('='.repeat(60));

const sortedModules = [...esmModules.entries()].sort((a, b) => a[1].line - b[1].line);

sortedModules.forEach(([name, info]) => {
    const depsStr = info.deps.length > 0 ? `\n    依赖: ${info.deps.join(', ')}` : '';
    console.log(`\n[${info.line}] ${name}${depsStr}`);
});

console.log('\n' + '='.repeat(60));
console.log('类定义列表');
console.log('='.repeat(60));

const sortedClasses = [...classes.entries()].sort((a, b) => a[1].line - b[1].line);
sortedClasses.forEach(([name, info]) => {
    console.log(`\n[${info.line}] ${name}`);
    console.log(`    方法: ${info.methods.slice(0, 5).join(', ')}${info.methods.length > 5 ? '...' : ''}`);
});

console.log('\n' + '='.repeat(60));
console.log('大型顶级函数 (>20行)');
console.log('='.repeat(60));

topLevelFunctions
    .filter(f => f.size > 20)
    .sort((a, b) => b.size - a.size)
    .slice(0, 20)
    .forEach(f => {
        console.log(`[${f.line}] ${f.name} (${f.size} 行)`);
    });

// 生成依赖图
console.log('\n' + '='.repeat(60));
console.log('模块依赖图 (Mermaid 格式)');
console.log('='.repeat(60));

console.log('\n```mermaid');
console.log('graph TD');
sortedModules.forEach(([name, info]) => {
    info.deps.forEach(dep => {
        console.log(`    ${name} --> ${dep}`);
    });
});
console.log('```');

// 建议拆分顺序（拓扑排序）
console.log('\n' + '='.repeat(60));
console.log('建议拆分顺序（从底层到顶层）');
console.log('='.repeat(60));

function topologicalSort(modules) {
    const visited = new Set();
    const result = [];
    
    function visit(name) {
        if (visited.has(name)) return;
        visited.add(name);
        
        const mod = modules.get(name);
        if (mod) {
            mod.deps.forEach(dep => visit(dep));
        }
        result.push(name);
    }
    
    for (const name of modules.keys()) {
        visit(name);
    }
    
    return result;
}

const sortOrder = topologicalSort(esmModules);
console.log('\n' + sortOrder.map((name, i) => `${i + 1}. ${name}`).join('\n'));

// 统计信息
console.log('\n' + '='.repeat(60));
console.log('统计信息');
console.log('='.repeat(60));
console.log(`总行数: ${code.split('\n').length}`);
console.log(`__esmModule 模块数: ${esmModules.size}`);
console.log(`类定义数: ${classes.size}`);
console.log(`顶级函数数: ${topLevelFunctions.length}`);

// 保存分析结果到 JSON
const outputPath = path.join(__dirname, '..', 'data', 'module-analysis.json');
const analysisResult = {
    timestamp: new Date().toISOString(),
    file: targetFile,
    stats: {
        totalLines: code.split('\n').length,
        esmModuleCount: esmModules.size,
        classCount: classes.size,
        functionCount: topLevelFunctions.length
    },
    modules: Object.fromEntries(sortedModules),
    classes: Object.fromEntries(sortedClasses),
    topFunctions: topLevelFunctions.filter(f => f.size > 20).slice(0, 50),
    splitOrder: sortOrder
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
console.log(`\n分析结果已保存到: ${outputPath}`);



