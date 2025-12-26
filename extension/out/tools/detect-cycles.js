/**
 * detect-cycles.js - 循环依赖检测工具
 * 
 * 使用方法:
 *   node detect-cycles.js [deps.json文件路径]
 * 
 * 示例:
 *   node detect-cycles.js extension.js.12-deps.json
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const depsFile = args[0] 
  ? path.resolve(process.cwd(), args[0])
  : path.resolve(__dirname, '../extension.js.12-deps.json');

console.log('🔍 循环依赖检测工具\n');
console.log(`📂 分析文件: ${depsFile}`);

// 检查文件是否存在
if (!fs.existsSync(depsFile)) {
  console.error(`❌ 错误: 文件不存在: ${depsFile}`);
  process.exit(1);
}

// 读取依赖数据
const data = JSON.parse(fs.readFileSync(depsFile, 'utf-8'));
const modules = data.modules;

console.log(`📦 总模块数: ${Object.keys(modules).length}`);
console.log(`📊 活跃模块: ${Object.values(modules).filter(m => !m.isDead).length}`);

// ============== 检测循环依赖 ==============

/**
 * 使用DFS检测所有循环依赖
 */
function detectAllCycles(modules) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();
  const currentPath = [];
  
  function dfs(moduleName) {
    if (recursionStack.has(moduleName)) {
      // 找到循环！提取循环路径
      const cycleStartIndex = currentPath.indexOf(moduleName);
      const cycle = [...currentPath.slice(cycleStartIndex), moduleName];
      
      // 规范化循环路径（从最小的模块名开始）
      const minIndex = cycle.slice(0, -1).reduce((minIdx, name, idx, arr) => 
        name < arr[minIdx] ? idx : minIdx, 0);
      const normalized = [...cycle.slice(minIndex, -1), ...cycle.slice(0, minIndex), cycle[minIndex]];
      
      // 检查是否已经记录过这个循环（可能从不同起点发现同一个循环）
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
    
    if (visited.has(moduleName)) {
      return; // 已经完全探索过这个节点
    }
    
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
  
  // 从每个模块开始搜索
  for (const moduleName of Object.keys(modules)) {
    if (!modules[moduleName].isDead && !visited.has(moduleName)) {
      dfs(moduleName);
    }
  }
  
  return cycles;
}

/**
 * 分析循环依赖涉及的模块
 */
function analyzeCycleModules(cycles, modules) {
  const moduleInCycles = new Map(); // moduleName -> 参与的循环数
  
  for (const cycle of cycles) {
    const modulesInCycle = cycle.path.slice(0, -1); // 去掉重复的最后一个
    for (const moduleName of modulesInCycle) {
      moduleInCycles.set(moduleName, (moduleInCycles.get(moduleName) || 0) + 1);
    }
  }
  
  // 按参与循环数排序
  const sorted = [...moduleInCycles.entries()]
    .map(([name, count]) => ({
      name,
      count,
      type: modules[name]?.type || '?',
      codeSize: modules[name]?.codeSize || 0,
      totalDeps: modules[name]?.dependencies?.length || 0,
      totalDependents: modules[name]?.dependents?.length || 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return sorted;
}

/**
 * 计算循环复杂度（涉及多少其他模块）
 */
function calculateCycleComplexity(cycle, modules) {
  const modulesInCycle = new Set(cycle.path.slice(0, -1));
  let internalDeps = 0;
  let externalDeps = 0;
  let externalDependents = 0;
  
  for (const moduleName of modulesInCycle) {
    const module = modules[moduleName];
    if (!module) continue;
    
    // 计算内部依赖（循环内）
    for (const dep of module.dependencies || []) {
      if (modulesInCycle.has(dep)) {
        internalDeps++;
      } else {
        externalDeps++;
      }
    }
    
    // 计算外部依赖者（循环外的模块依赖循环内的模块）
    for (const dependent of module.dependents || []) {
      if (!modulesInCycle.has(dependent)) {
        externalDependents++;
      }
    }
  }
  
  return {
    internalDeps,
    externalDeps,
    externalDependents,
    totalSize: [...modulesInCycle].reduce((sum, name) => 
      sum + (modules[name]?.codeSize || 0), 0)
  };
}

// 执行检测
console.log('\n🔗 检测循环依赖...\n');

const cycles = detectAllCycles(modules);

console.log('═'.repeat(70));
console.log('📊 检测结果');
console.log('═'.repeat(70));

if (cycles.length === 0) {
  console.log('\n✅ 未发现循环依赖！');
} else {
  console.log(`\n⚠️  发现 ${cycles.length} 个循环依赖:\n`);
  
  // 按长度分组
  const cyclesByLength = new Map();
  for (const cycle of cycles) {
    const length = cycle.length;
    if (!cyclesByLength.has(length)) {
      cyclesByLength.set(length, []);
    }
    cyclesByLength.get(length).push(cycle);
  }
  
  // 显示统计
  console.log('   循环长度分布:');
  for (const [length, cyclelist] of [...cyclesByLength.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`      长度 ${length}: ${cyclelist.length} 个循环`);
  }
  
  // 显示详细信息
  console.log('\n' + '─'.repeat(70));
  console.log('📋 循环依赖详情:\n');
  
  cycles
    .sort((a, b) => a.length - b.length)
    .forEach((cycle, index) => {
      const complexity = calculateCycleComplexity(cycle, modules);
      
      console.log(`${index + 1}. 循环长度: ${cycle.length}`);
      console.log(`   路径: ${cycle.path.join(' -> ')}`);
      console.log(`   复杂度:`);
      console.log(`      - 循环内部依赖: ${complexity.internalDeps}`);
      console.log(`      - 外部依赖: ${complexity.externalDeps}`);
      console.log(`      - 被外部依赖: ${complexity.externalDependents}`);
      console.log(`      - 总代码大小: ${(complexity.totalSize / 1024).toFixed(1)} KB`);
      
      // 显示循环中每个模块的详细信息
      console.log(`   模块详情:`);
      const modulesInCycle = cycle.path.slice(0, -1);
      for (const moduleName of modulesInCycle) {
        const module = modules[moduleName];
        if (module) {
          console.log(`      - ${moduleName}:`);
          console.log(`          类型: ${module.type}`);
          console.log(`          大小: ${(module.codeSize / 1024).toFixed(2)} KB`);
          console.log(`          依赖数: ${module.dependencies?.length || 0}`);
          console.log(`          被依赖数: ${module.dependents?.length || 0}`);
        }
      }
      console.log('');
    });
  
  // 分析参与循环最多的模块
  console.log('─'.repeat(70));
  console.log('🎯 参与循环最多的模块:\n');
  
  const cycleModules = analyzeCycleModules(cycles, modules);
  
  cycleModules.slice(0, 15).forEach((item, index) => {
    console.log(`${index + 1}. ${item.name}`);
    console.log(`   参与 ${item.count} 个循环`);
    console.log(`   类型: ${item.type}`);
    console.log(`   大小: ${(item.codeSize / 1024).toFixed(2)} KB`);
    console.log(`   依赖: ${item.totalDeps} 个模块`);
    console.log(`   被依赖: ${item.totalDependents} 次`);
    console.log('');
  });
  
  // 建议
  console.log('─'.repeat(70));
  console.log('💡 解决建议:\n');
  console.log('   1. 优先解决短循环（2-3个模块的循环）');
  console.log('   2. 重点关注参与多个循环的模块');
  console.log('   3. 考虑提取共同依赖到独立模块');
  console.log('   4. 使用依赖注入或事件系统打破循环');
  console.log('   5. 重构大型模块，拆分职责');
}

console.log('\n' + '═'.repeat(70));
console.log('✅ 检测完成!');
console.log('═'.repeat(70));

