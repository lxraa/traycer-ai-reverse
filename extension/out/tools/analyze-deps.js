/**
 * analyze-deps.js - 模块依赖分析工具
 * 
 * 使用方法:
 *   node analyze-deps.js [输入文件] [输出文件] [--commonjs=名称] [--esm=名称]
 * 
 * 示例:
 *   node analyze-deps.js                                    # 默认分析 extension.deobfuscate.js
 *   node analyze-deps.js ../out/extension.js                # 分析 unbundle 后的文件
 *   node analyze-deps.js ../out/extension.js deps-after.json  # 指定输出文件
 *   node analyze-deps.js ../out/extension.js -o deps.json --commonjs=k --esm=T  # 自定义闭包名称
 *   node analyze-deps.js ../out/extension.js --commonjs=__commonJS --esm=__esmModule  # 使用不同的闭包名称
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 解析命令行参数
const args = process.argv.slice(2);

// 解析选项参数
function parseArgs(args) {
  let inputFile = null;
  let outputFile = null;
  let commonjsName = 'k';  // 默认 CommonJS 闭包名称
  let esmName = 'T';       // 默认 ESM 闭包名称
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--commonjs=')) {
      commonjsName = arg.slice('--commonjs='.length);
    } else if (arg.startsWith('--esm=')) {
      esmName = arg.slice('--esm='.length);
    } else if (arg === '-o' && i + 1 < args.length) {
      outputFile = args[++i];
    } else if (!arg.startsWith('-')) {
      if (!inputFile) {
        inputFile = arg;
      } else if (!outputFile) {
        outputFile = arg;
      }
    }
  }
  
  return { inputFile, outputFile, commonjsName, esmName };
}

const parsedArgs = parseArgs(args);

const inputFile = parsedArgs.inputFile 
  ? path.resolve(process.cwd(), parsedArgs.inputFile)
  : path.resolve(__dirname, '../out/extension.deobfuscate.js');

const defaultOutputName = path.basename(inputFile, '.js') + '-deps.json';
const outputFile = parsedArgs.outputFile
  ? path.resolve(process.cwd(), parsedArgs.outputFile)
  : path.resolve(path.dirname(inputFile), defaultOutputName);

// 闭包名称配置
const COMMONJS_CLOSURE = parsedArgs.commonjsName;
const ESM_CLOSURE = parsedArgs.esmName;

console.log('📦 模块依赖分析工具\n');
console.log(`📂 输入文件: ${inputFile}`);
console.log(`📄 输出文件: ${outputFile}`);
console.log(`🔧 闭包名称: CommonJS=${COMMONJS_CLOSURE}, ESM=${ESM_CLOSURE}`);

// 检查输入文件是否存在
if (!fs.existsSync(inputFile)) {
  console.error(`❌ 错误: 输入文件不存在: ${inputFile}`);
  process.exit(1);
}

// 读取文件
const code = fs.readFileSync(inputFile, 'utf-8');
const fileSize = (code.length / 1024 / 1024).toFixed(2);
console.log(`📊 文件大小: ${fileSize} MB`);

// ============== 分析模块依赖关系 ==============

function analyzeDependencies(code, commonjsClosure = COMMONJS_CLOSURE, esmClosure = ESM_CLOSURE) {
  console.log('\n🔗 分析模块依赖关系...');
  
  const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
    errorRecovery: true,
  });
  
  // 收集所有模块定义
  const modules = new Map(); // moduleName -> { type, startLine, endLine, codeSize }
  const allModuleNames = new Set();
  
  // 闭包名称集合
  const closureNames = new Set([commonjsClosure, esmClosure]);
  
  // 第一遍：收集所有模块名称
  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      
      if (!t.isIdentifier(id)) return;
      if (!t.isCallExpression(init)) return;
      if (!t.isIdentifier(init.callee)) return;
      
      const funcName = init.callee.name;
      if (closureNames.has(funcName)) {
        allModuleNames.add(id.name);
      }
    }
  });
  
  console.log(`   📦 发现 ${allModuleNames.size} 个模块定义`);
  
  // 第二遍：分析每个模块的依赖
  const dependencies = new Map(); // moduleName -> Set<dependencyName>
  const reverseDeps = new Map();  // moduleName -> Set<dependentName> (谁依赖我)
  
  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      
      if (!t.isIdentifier(id)) return;
      if (!t.isCallExpression(init)) return;
      if (!t.isIdentifier(init.callee)) return;
      
      const funcName = init.callee.name;
      if (!closureNames.has(funcName)) return;
      
      const moduleName = id.name;
      const loc = path.node.loc;
      const moduleCode = generate(init).code;
      
      // 检测是否为死代码
      const isDead = moduleCode.includes('[dead-code]') || 
                     moduleCode === `${commonjsClosure}(() => ({}))` ||
                     moduleCode === `${esmClosure}(() => undefined)`;
      
      // 存储模块信息
      modules.set(moduleName, {
        type: funcName,
        startLine: loc ? loc.start.line : 0,
        endLine: loc ? loc.end.line : 0,
        codeSize: moduleCode.length,
        isDead,
        // 存储代码片段用于分析（限制大小）
        codeSnippet: moduleCode.length > 500 ? moduleCode.slice(0, 500) + '...' : moduleCode,
      });
      
      // 分析依赖 - 在模块代码中查找对其他模块的调用
      const deps = new Set();
      
      // 对于死代码，不分析内部依赖
      if (!isDead) {
        path.traverse({
          // 查找函数调用: someModule()
          CallExpression(innerPath) {
            const callee = innerPath.node.callee;
            if (t.isIdentifier(callee) && allModuleNames.has(callee.name)) {
              if (callee.name !== moduleName) { // 排除自引用
                deps.add(callee.name);
              }
            }
          },
          // 查找标识符引用 (不仅是调用)
          Identifier(innerPath) {
            const name = innerPath.node.name;
            if (!allModuleNames.has(name) || name === moduleName) return;
            
            // 排除属性访问中的属性名
            const parent = innerPath.parent;
            if (t.isMemberExpression(parent) && parent.property === innerPath.node && !parent.computed) {
              return;
            }
            // 排除变量声明的左侧
            if (t.isVariableDeclarator(parent) && parent.id === innerPath.node) {
              return;
            }
            // 排除对象属性的 key
            if (t.isObjectProperty(parent) && parent.key === innerPath.node && !parent.computed) {
              return;
            }
            
            deps.add(name);
          }
        });
      }
      
      dependencies.set(moduleName, deps);
      
      // 构建反向依赖
      for (const dep of deps) {
        if (!reverseDeps.has(dep)) {
          reverseDeps.set(dep, new Set());
        }
        reverseDeps.get(dep).add(moduleName);
      }
    }
  });
  
  // 计算统计信息
  const allModules = [...modules.values()];
  const liveModules = allModules.filter(m => !m.isDead);
  const deadModules = allModules.filter(m => m.isDead);
  
  const stats = {
    totalModules: modules.size,
    liveModules: liveModules.length,
    deadModules: deadModules.length,
    commonjsModules: allModules.filter(m => m.type === commonjsClosure).length,
    esmModules: allModules.filter(m => m.type === esmClosure).length,
    commonjsClosure,
    esmClosure,
    totalCodeSize: allModules.reduce((sum, m) => sum + m.codeSize, 0),
    liveCodeSize: liveModules.reduce((sum, m) => sum + m.codeSize, 0),
  };
  
  // 找出独立模块（没有依赖其他模块）
  const independentModules = [];
  for (const [name, deps] of dependencies) {
    if (deps.size === 0 && !modules.get(name)?.isDead) {
      independentModules.push(name);
    }
  }
  
  // 找出被依赖最多的模块 (排除死代码)
  const mostDepended = [...reverseDeps.entries()]
    .filter(([name]) => !modules.get(name)?.isDead)
    .map(([name, dependents]) => ({ name, count: dependents.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  
  // 找出顶层模块 (没有被依赖的模块)
  const topLevelModules = [...modules.entries()]
    .filter(([name, info]) => {
      const revDeps = reverseDeps.get(name);
      return (!revDeps || revDeps.size === 0) && !info.isDead;
    })
    .map(([name, info]) => ({
      name,
      type: info.type,
      codeSize: info.codeSize,
      dependencies: [...(dependencies.get(name) || [])],
    }))
    .sort((a, b) => b.codeSize - a.codeSize);
  
  // 按大小排序的活跃模块
  const modulesBySize = [...modules.entries()]
    .filter(([name, info]) => !info.isDead)
    .map(([name, info]) => ({
      name,
      type: info.type,
      codeSize: info.codeSize,
      dependents: reverseDeps.get(name)?.size || 0,
      dependencies: dependencies.get(name)?.size || 0,
    }))
    .sort((a, b) => b.codeSize - a.codeSize);
  
  return {
    stats,
    modules,
    dependencies,
    reverseDeps,
    independentModules,
    mostDepended,
    topLevelModules,
    modulesBySize,
  };
}

// 执行分析
const result = analyzeDependencies(code);

// 打印统计信息
console.log('\n' + '═'.repeat(70));
console.log('📊 分析结果摘要');
console.log('═'.repeat(70));

console.log(`\n   模块统计:`);
console.log(`      总模块数: ${result.stats.totalModules}`);
console.log(`      活跃模块: ${result.stats.liveModules}`);
console.log(`      死代码模块: ${result.stats.deadModules}`);
console.log(`      ${result.stats.commonjsClosure}() 模块: ${result.stats.commonjsModules}`);
console.log(`      ${result.stats.esmClosure}() 模块: ${result.stats.esmModules}`);

console.log(`\n   代码大小:`);
console.log(`      总大小: ${(result.stats.totalCodeSize / 1024).toFixed(1)} KB`);
console.log(`      活跃代码: ${(result.stats.liveCodeSize / 1024).toFixed(1)} KB`);

console.log(`\n   顶层模块 (入口点): ${result.topLevelModules.length} 个`);
result.topLevelModules.slice(0, 10).forEach((mod, i) => {
  console.log(`      ${i + 1}. ${mod.name} (${mod.type}) - ${(mod.codeSize / 1024).toFixed(1)} KB`);
});

console.log(`\n   被依赖最多的模块:`);
result.mostDepended.slice(0, 10).forEach((item, i) => {
  const mod = result.modules.get(item.name);
  console.log(`      ${i + 1}. ${item.name}: ${item.count} 次 (${mod?.type || '?'}, ${((mod?.codeSize || 0) / 1024).toFixed(1)} KB)`);
});

console.log(`\n   最大的活跃模块:`);
result.modulesBySize.slice(0, 10).forEach((mod, i) => {
  console.log(`      ${i + 1}. ${mod.name} (${mod.type}) - ${(mod.codeSize / 1024).toFixed(1)} KB`);
});

// 生成输出文件
const output = {
  meta: {
    inputFile: inputFile,
    analyzedAt: new Date().toISOString(),
    fileSize: code.length,
  },
  stats: result.stats,
  modules: Object.fromEntries(
    [...result.modules.entries()].map(([name, info]) => [
      name,
      {
        type: info.type,
        startLine: info.startLine,
        endLine: info.endLine,
        codeSize: info.codeSize,
        isDead: info.isDead,
        dependencies: [...(result.dependencies.get(name) || [])],
        dependents: [...(result.reverseDeps.get(name) || [])],
      }
    ])
  ),
  analysis: {
    topLevelModules: result.topLevelModules,
    mostDepended: result.mostDepended,
    modulesBySize: result.modulesBySize.slice(0, 100),
    independentModules: result.independentModules,
  },
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

console.log('\n' + '═'.repeat(70));
console.log(`✅ 分析完成! 结果已保存到: ${outputFile}`);
console.log('═'.repeat(70));

