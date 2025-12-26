/**
 * cycle-report.js - 生成简洁的循环依赖报告
 * 
 * 使用方法:
 *   node cycle-report.js [deps.json文件路径]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const depsFile = args[0] 
  ? path.resolve(process.cwd(), args[0])
  : path.resolve(__dirname, '../extension.js.12-deps.json');

console.log('🔍 循环依赖简洁报告\n');
console.log(`📂 分析文件: ${depsFile}\n`);

if (!fs.existsSync(depsFile)) {
  console.error(`❌ 错误: 文件不存在: ${depsFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(depsFile, 'utf-8'));
const modules = data.modules;

// 检测循环依赖
function detectAllCycles(modules) {
  const cycles = [];
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
  
  return cycles;
}

function analyzeCycleModules(cycles, modules) {
  const moduleInCycles = new Map();
  
  for (const cycle of cycles) {
    const modulesInCycle = cycle.path.slice(0, -1);
    for (const moduleName of modulesInCycle) {
      moduleInCycles.set(moduleName, (moduleInCycles.get(moduleName) || 0) + 1);
    }
  }
  
  return [...moduleInCycles.entries()]
    .map(([name, count]) => ({
      name,
      count,
      type: modules[name]?.type || '?',
      codeSize: modules[name]?.codeSize || 0,
      totalDeps: modules[name]?.dependencies?.length || 0,
      totalDependents: modules[name]?.dependents?.length || 0
    }))
    .sort((a, b) => b.count - a.count);
}

const cycles = detectAllCycles(modules);

console.log('═'.repeat(70));
console.log('📊 循环依赖统计');
console.log('═'.repeat(70));
console.log(`\n⚠️  发现 ${cycles.length} 个循环依赖\n`);

// 按长度分组
const cyclesByLength = new Map();
for (const cycle of cycles) {
  const length = cycle.length;
  if (!cyclesByLength.has(length)) {
    cyclesByLength.set(length, []);
  }
  cyclesByLength.get(length).push(cycle);
}

console.log('循环长度分布:');
for (const [length, cyclelist] of [...cyclesByLength.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`   长度 ${length}: ${cyclelist.length} 个`);
}

console.log('\n' + '─'.repeat(70));
console.log('🔥 最短的循环（长度为2，最容易解决）\n');

cycles
  .filter(c => c.length === 2)
  .slice(0, 15)
  .forEach((cycle, index) => {
    console.log(`${index + 1}. ${cycle.path[0]} ⇄ ${cycle.path[1]}`);
  });

console.log('\n' + '─'.repeat(70));
console.log('🎯 参与循环最多的模块（重点优化目标）\n');

const cycleModules = analyzeCycleModules(cycles, modules);

cycleModules.slice(0, 20).forEach((item, index) => {
  console.log(`${index + 1}. ${item.name}`);
  console.log(`   参与 ${item.count} 个循环 | 大小: ${(item.codeSize / 1024).toFixed(1)} KB | 依赖: ${item.totalDeps} | 被依赖: ${item.totalDependents}`);
});

console.log('\n' + '─'.repeat(70));
console.log('💡 优化建议\n');

console.log('1. 优先解决【长度为2的循环】- 这些最容易打破:');
const len2Cycles = cycles.filter(c => c.length === 2);
console.log(`   共有 ${len2Cycles.length} 个双向依赖需要解决\n`);

console.log('2. 重点关注【高频循环模块】:');
const topModules = cycleModules.slice(0, 5);
topModules.forEach(m => {
  console.log(`   - ${m.name} (参与${m.count}个循环)`);
});
console.log('');

console.log('3. 常见解决方案:');
console.log('   a) 提取共同依赖到独立模块');
console.log('   b) 使用依赖注入（DI）');
console.log('   c) 使用事件系统解耦');
console.log('   d) 延迟加载（lazy loading）');
console.log('   e) 接口分离（Interface Segregation）');

console.log('\n' + '═'.repeat(70));

// 导出详细数据
const reportData = {
  summary: {
    totalCycles: cycles.length,
    cyclesByLength: Object.fromEntries(cyclesByLength.entries()),
  },
  topCyclicModules: cycleModules.slice(0, 20),
  shortestCycles: cycles.filter(c => c.length === 2).map(c => ({
    module1: c.path[0],
    module2: c.path[1]
  }))
};

const outputFile = depsFile.replace('.json', '-cycle-report.json');
fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2), 'utf-8');
console.log(`\n✅ 详细报告已保存到: ${outputFile}`);
console.log('═'.repeat(70) + '\n');

