/**
 * find_ready_module.js - 查找可以拆分的 ready module
 * 
 * Ready Module 定义：
 *   - 没有依赖其他模块
 *   - 或者所有依赖都在白名单中
 * 
 * 使用方法:
 *   node find_ready_module.js [--whitelist=path] [--input=path]
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 默认路径
const DEFAULT_INPUT = path.resolve(__dirname, '../extension.js');
const DEFAULT_WHITELIST = path.resolve(__dirname, 'module-whitelist.json');

// 闭包名称
const COMMONJS_CLOSURE = '__commonJS';
const ESM_CLOSURE = '__esmModule';

// 解析命令行参数
function parseArgs(args) {
  let inputFile = DEFAULT_INPUT;
  let whitelistFile = DEFAULT_WHITELIST;
  
  for (const arg of args) {
    if (arg.startsWith('--whitelist=')) {
      whitelistFile = path.resolve(process.cwd(), arg.slice('--whitelist='.length));
    } else if (arg.startsWith('--input=')) {
      inputFile = path.resolve(process.cwd(), arg.slice('--input='.length));
    } else if (!arg.startsWith('-')) {
      inputFile = path.resolve(process.cwd(), arg);
    }
  }
  
  return { inputFile, whitelistFile };
}

// 分析模块依赖
function analyzeModules(code) {
  const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
    errorRecovery: true,
  });
  
  const modules = new Map(); // moduleName -> { type, startLine, endLine, code }
  const allModuleNames = new Set();
  const closureNames = new Set([COMMONJS_CLOSURE, ESM_CLOSURE]);
  
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
  
  // 第二遍：分析每个模块的依赖
  const dependencies = new Map(); // moduleName -> Set<dependencyName>
  
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
      const moduleCode = generate(path.parentPath.node).code;
      
      // 检测是否为死代码
      const isDead = moduleCode.includes('[dead-code]') || 
                     moduleCode === `${COMMONJS_CLOSURE}(() => ({}))` ||
                     moduleCode === `${ESM_CLOSURE}(() => undefined)`;
      
      if (isDead) return; // 跳过死代码
      
      // 存储模块信息
      modules.set(moduleName, {
        type: funcName,
        startLine: loc ? loc.start.line : 0,
        endLine: loc ? loc.end.line : 0,
        codeSize: moduleCode.length,
        code: moduleCode,
      });
      
      // 分析依赖 - 在模块代码中查找对其他模块的调用
      const deps = new Set();
      
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
      
      dependencies.set(moduleName, deps);
    }
  });
  
  return { modules, dependencies, allModuleNames };
}

// 查找 ready modules
function findReadyModules(modules, dependencies, whitelist) {
  const whitelistSet = new Set(whitelist);
  const readyModules = [];
  
  for (const [moduleName, deps] of dependencies) {
    const moduleInfo = modules.get(moduleName);
    if (!moduleInfo) continue;
    
    // 检查所有依赖是否都在白名单中
    const unresolvedDeps = [...deps].filter(dep => !whitelistSet.has(dep));
    
    if (unresolvedDeps.length === 0) {
      readyModules.push({
        name: moduleName,
        type: moduleInfo.type,
        startLine: moduleInfo.startLine,
        endLine: moduleInfo.endLine,
        codeSize: moduleInfo.codeSize,
        dependencies: [...deps],
      });
    }
  }
  
  // 按行号排序（先定义的先处理）
  readyModules.sort((a, b) => a.startLine - b.startLine);
  
  return readyModules;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const { inputFile, whitelistFile } = parseArgs(args);
  
  console.log('🔍 查找 Ready Modules\n');
  console.log(`📂 输入文件: ${inputFile}`);
  console.log(`📋 白名单文件: ${whitelistFile}`);
  
  // 检查文件
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ 输入文件不存在: ${inputFile}`);
    process.exit(1);
  }
  
  // 读取白名单
  let whitelist = [];
  if (fs.existsSync(whitelistFile)) {
    const whitelistData = JSON.parse(fs.readFileSync(whitelistFile, 'utf-8'));
    whitelist = whitelistData.whitelist || [];
    console.log(`✅ 白名单已加载: ${whitelist.length} 个模块`);
  } else {
    console.log(`⚠️  白名单文件不存在，将创建空白名单`);
  }
  
  // 读取代码
  const code = fs.readFileSync(inputFile, 'utf-8');
  console.log(`📊 文件大小: ${(code.length / 1024 / 1024).toFixed(2)} MB\n`);
  
  // 分析模块
  console.log('🔗 分析模块依赖...');
  const { modules, dependencies, allModuleNames } = analyzeModules(code);
  console.log(`   📦 发现 ${modules.size} 个活跃模块\n`);
  
  // 查找 ready modules
  const readyModules = findReadyModules(modules, dependencies, whitelist);
  
  console.log('═'.repeat(70));
  console.log(`🎯 Ready Modules (可以拆分): ${readyModules.length} 个`);
  console.log('═'.repeat(70));
  
  if (readyModules.length === 0) {
    console.log('\n⚠️  没有找到可以拆分的模块');
    console.log('   可能所有模块都有未解决的依赖\n');
    
    // 显示有最少依赖的模块
    const modulesWithDeps = [...dependencies.entries()]
      .map(([name, deps]) => ({
        name,
        deps: [...deps],
        unresolvedDeps: [...deps].filter(d => !whitelist.includes(d)),
      }))
      .filter(m => modules.has(m.name))
      .sort((a, b) => a.unresolvedDeps.length - b.unresolvedDeps.length);
    
    console.log('📊 依赖最少的模块:');
    modulesWithDeps.slice(0, 5).forEach((m, i) => {
      const info = modules.get(m.name);
      console.log(`   ${i + 1}. ${m.name} (${info.type})`);
      console.log(`      行: ${info.startLine}-${info.endLine}, 大小: ${(info.codeSize / 1024).toFixed(1)} KB`);
      console.log(`      未解决依赖 (${m.unresolvedDeps.length}): ${m.unresolvedDeps.join(', ') || '无'}`);
    });
  } else {
    readyModules.forEach((mod, i) => {
      console.log(`\n${i + 1}. ${mod.name}`);
      console.log(`   类型: ${mod.type}`);
      console.log(`   行范围: ${mod.startLine} - ${mod.endLine}`);
      console.log(`   代码大小: ${(mod.codeSize / 1024).toFixed(1)} KB`);
      console.log(`   依赖: ${mod.dependencies.length > 0 ? mod.dependencies.join(', ') : '无'}`);
    });
    
    // 推荐第一个
    const first = readyModules[0];
    console.log('\n' + '═'.repeat(70));
    console.log('💡 建议先处理:');
    console.log('═'.repeat(70));
    console.log(`\n   模块名: ${first.name}`);
    console.log(`   类型: ${first.type}`);
    console.log(`   行范围: ${first.startLine} - ${first.endLine}`);
    console.log(`   依赖: ${first.dependencies.length > 0 ? first.dependencies.join(', ') : '无'}`);
    console.log(`\n   拆分步骤:`);
    console.log(`   1. 读取 extension.js 的第 ${first.startLine}-${first.endLine} 行`);
    console.log(`   2. 创建 modules/${first.name}.js 文件`);
    console.log(`   3. 在主文件中删除该模块定义`);
    console.log(`   4. 在导入区添加: var ${first.name} = require('./modules/${first.name}.js');`);
    console.log(`   5. 将 "${first.name}" 添加到白名单`);
  }
  
  console.log('\n');
}

main();

