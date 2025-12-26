/**
 * analyze-module-symbols.js - 分析模块内部定义的符号（函数、类、变量）
 * 
 * 目标：理解每个模块内部定义了什么，这些符号如何在循环依赖中被引用
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const args = process.argv.slice(2);
const codeFile = args[0] || path.resolve(__dirname, '../extension.js.12');
const depsFile = args[1] || path.resolve(__dirname, '../extension.js.12-deps.json');
const targetCycles = args[2] ? args[2].split(',') : null; // 指定要分析的循环，如 "initPathModule,initWorkspaceInfo"

console.log('🔍 模块符号分析工具\n');
console.log(`📂 代码文件: ${codeFile}`);
console.log(`📊 依赖文件: ${depsFile}\n`);

const code = fs.readFileSync(codeFile, 'utf-8');
const depsData = JSON.parse(fs.readFileSync(depsFile, 'utf-8'));

console.log('🔗 解析模块内部符号...\n');

const ast = parser.parse(code, {
  sourceType: 'script',
  plugins: ['jsx'],
  errorRecovery: true,
});

// 存储每个模块的符号信息
const moduleSymbols = new Map();

// 提取每个模块内部定义的符号
traverse(ast, {
  VariableDeclarator(path) {
    const id = path.node.id;
    const init = path.node.init;
    
    if (!t.isIdentifier(id)) return;
    if (!t.isCallExpression(init)) return;
    if (!t.isIdentifier(init.callee)) return;
    
    const funcName = init.callee.name;
    if (funcName !== '__esmModule' && funcName !== '__commonJS') return;
    
    const moduleName = id.name;
    const symbols = {
      functions: new Set(),
      classes: new Set(),
      variables: new Set(),
      imports: new Set(), // 依赖的其他模块
      codeSnippets: []
    };
    
    // 分析模块内部
    path.traverse({
      // 收集函数定义
      FunctionDeclaration(innerPath) {
        if (innerPath.node.id && t.isIdentifier(innerPath.node.id)) {
          const name = innerPath.node.id.name;
          // 过滤混淆的变量名
          if (!name.startsWith('_0x')) {
            symbols.functions.add(name);
          }
        }
      },
      
      // 收集类定义
      ClassDeclaration(innerPath) {
        if (innerPath.node.id && t.isIdentifier(innerPath.node.id)) {
          const name = innerPath.node.id.name;
          if (!name.startsWith('_0x')) {
            symbols.classes.add(name);
          }
        }
      },
      
      // 收集变量定义（非混淆的）
      VariableDeclarator(innerPath) {
        if (innerPath.node.id && t.isIdentifier(innerPath.node.id)) {
          const name = innerPath.node.id.name;
          // 只记录有意义的变量名
          if (!name.startsWith('_0x') && name.length > 2) {
            symbols.variables.add(name);
          }
        }
      },
      
      // 收集对其他模块的调用（imports）
      CallExpression(innerPath) {
        const callee = innerPath.node.callee;
        if (t.isIdentifier(callee)) {
          const name = callee.name;
          // 检查是否是其他init模块
          if (name.startsWith('init') && name !== moduleName) {
            symbols.imports.add(name);
          }
        }
      }
    });
    
    // 提取代码片段（前5个有意义的函数）
    let funcCount = 0;
    path.traverse({
      FunctionDeclaration(innerPath) {
        if (funcCount >= 5) return;
        if (innerPath.node.id && t.isIdentifier(innerPath.node.id)) {
          const name = innerPath.node.id.name;
          if (!name.startsWith('_0x')) {
            const params = innerPath.node.params.map(p => 
              t.isIdentifier(p) ? p.name : '...'
            ).join(', ');
            symbols.codeSnippets.push(`function ${name}(${params})`);
            funcCount++;
          }
        }
      }
    });
    
    moduleSymbols.set(moduleName, {
      functions: Array.from(symbols.functions),
      classes: Array.from(symbols.classes),
      variables: Array.from(symbols.variables),
      imports: Array.from(symbols.imports),
      codeSnippets: symbols.codeSnippets
    });
  }
});

console.log(`   📦 分析了 ${moduleSymbols.size} 个模块\n`);

// 读取循环依赖
const cycles = [];
if (depsData.modules) {
  const modules = depsData.modules;
  const visited = new Set();
  const recursionStack = new Set();
  const currentPath = [];
  
  function dfs(moduleName) {
    if (recursionStack.has(moduleName)) {
      const cycleStartIndex = currentPath.indexOf(moduleName);
      const cycle = [...currentPath.slice(cycleStartIndex), moduleName];
      const minIndex = cycle.slice(0, -1).reduce((minIdx, name, idx, arr) => 
        name < arr[minIdx] ? idx : minIdx, 0);
      const normalized = [...cycle.slice(minIndex, -1), ...cycle.slice(0, minIndex), cycle[minIndex]];
      const cycleKey = normalized.slice(0, -1).join(' -> ');
      if (!cycles.some(c => c.key === cycleKey)) {
        cycles.push({
          key: cycleKey,
          path: normalized,
          length: normalized.length - 1
        });
      }
      return;
    }
    
    if (visited.has(moduleName)) return;
    
    recursionStack.add(moduleName);
    currentPath.push(moduleName);
    
    const module = modules[moduleName];
    if (module && !module.isDead) {
      const deps = module.dependencies || [];
      for (const dep of deps) {
        dfs(dep);
      }
    }
    
    currentPath.pop();
    recursionStack.delete(moduleName);
    visited.add(moduleName);
  }
  
  for (const moduleName of Object.keys(modules)) {
    if (!modules[moduleName].isDead && !visited.has(moduleName)) {
      dfs(moduleName);
    }
  }
}

// 过滤要分析的循环
let cyclesToAnalyze = cycles.filter(c => c.length === 2);
if (targetCycles) {
  cyclesToAnalyze = cyclesToAnalyze.filter(c => {
    const mods = c.path.slice(0, 2);
    return targetCycles.includes(mods[0]) || targetCycles.includes(mods[1]);
  });
}

console.log('═'.repeat(80));
console.log('📊 循环依赖符号分析');
console.log('═'.repeat(80));
console.log(`\n分析 ${cyclesToAnalyze.length} 个双向依赖\n`);

cyclesToAnalyze.forEach((cycle, index) => {
  const [mod1, mod2] = cycle.path.slice(0, 2);
  const symbols1 = moduleSymbols.get(mod1) || {};
  const symbols2 = moduleSymbols.get(mod2) || {};
  
  console.log('─'.repeat(80));
  console.log(`\n${index + 1}. ${mod1} ⇄ ${mod2}\n`);
  
  // 模块1
  console.log(`   📦 ${mod1}:`);
  console.log(`      函数 (${symbols1.functions?.length || 0}个): ${
    (symbols1.functions || []).slice(0, 10).join(', ') || '无'
  }`);
  if ((symbols1.functions || []).length > 10) {
    console.log(`      ... 还有 ${symbols1.functions.length - 10} 个`);
  }
  
  if ((symbols1.classes || []).length > 0) {
    console.log(`      类 (${symbols1.classes.length}个): ${
      symbols1.classes.slice(0, 5).join(', ')
    }`);
  }
  
  if ((symbols1.codeSnippets || []).length > 0) {
    console.log(`\n      代码示例:`);
    symbols1.codeSnippets.forEach(snippet => {
      console.log(`         ${snippet}`);
    });
  }
  
  console.log(`\n      依赖模块 (${symbols1.imports?.length || 0}个): ${
    (symbols1.imports || []).slice(0, 8).join(', ') || '无'
  }`);
  
  // 模块2
  console.log(`\n   📦 ${mod2}:`);
  console.log(`      函数 (${symbols2.functions?.length || 0}个): ${
    (symbols2.functions || []).slice(0, 10).join(', ') || '无'
  }`);
  if ((symbols2.functions || []).length > 10) {
    console.log(`      ... 还有 ${symbols2.functions.length - 10} 个`);
  }
  
  if ((symbols2.classes || []).length > 0) {
    console.log(`      类 (${symbols2.classes.length}个): ${
      symbols2.classes.slice(0, 5).join(', ')
    }`);
  }
  
  if ((symbols2.codeSnippets || []).length > 0) {
    console.log(`\n      代码示例:`);
    symbols2.codeSnippets.forEach(snippet => {
      console.log(`         ${snippet}`);
    });
  }
  
  console.log(`\n      依赖模块 (${symbols2.imports?.length || 0}个): ${
    (symbols2.imports || []).slice(0, 8).join(', ') || '无'
  }`);
  
  // 分析建议
  console.log(`\n   💡 拆分建议:`);
  
  const funcs1 = symbols1.functions?.length || 0;
  const funcs2 = symbols2.functions?.length || 0;
  const totalSymbols1 = funcs1 + (symbols1.classes?.length || 0);
  const totalSymbols2 = funcs2 + (symbols2.classes?.length || 0);
  
  if (totalSymbols1 === 0 && totalSymbols2 === 0) {
    console.log(`      ⚠️  两个模块都没有导出符号，可能是纯副作用模块（初始化）`);
    console.log(`      → 检查是否只是调用其他模块，考虑合并或移除其中一个`);
  } else if (funcs1 > 20 || funcs2 > 20) {
    const bigMod = funcs1 > funcs2 ? mod1 : mod2;
    console.log(`      ⚠️  ${bigMod} 函数数量过多，是大型模块`);
    console.log(`      → 优先拆分大模块，按功能领域分离`);
  } else if (totalSymbols1 > totalSymbols2 * 3) {
    console.log(`      → ${mod1} 较大，${mod2} 可能是其辅助模块`);
    console.log(`      → 建议将 ${mod2} 合并到 ${mod1} 或作为其子模块`);
  } else if (totalSymbols2 > totalSymbols1 * 3) {
    console.log(`      → ${mod2} 较大，${mod1} 可能是其辅助模块`);
    console.log(`      → 建议将 ${mod1} 合并到 ${mod2} 或作为其子模块`);
  } else {
    console.log(`      → 两个模块大小相近，职责可能有重叠`);
    console.log(`      → 提取公共部分到第三个模块，或使用依赖注入`);
  }
  
  // 检查是否有共同依赖
  const imports1 = new Set(symbols1.imports || []);
  const imports2 = new Set(symbols2.imports || []);
  const commonImports = [...imports1].filter(x => imports2.has(x));
  
  if (commonImports.length > 0) {
    console.log(`\n      🔗 共同依赖 (${commonImports.length}个): ${commonImports.slice(0, 5).join(', ')}`);
    console.log(`      → 可能可以通过这些共同依赖来解耦`);
  }
  
  console.log('');
});

console.log('═'.repeat(80));
console.log('\n✅ 分析完成!\n');
console.log('💡 提示: 使用以下命令分析特定循环:');
console.log(`   node analyze-module-symbols.js <file> <deps> "initModule1,initModule2"\n`);
console.log('═'.repeat(80));

