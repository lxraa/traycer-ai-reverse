/**
 * cycle-visualizer.js - 生成循环依赖可视化（DOT格式）
 * 
 * 使用方法:
 *   node cycle-visualizer.js [deps.json文件路径]
 * 
 * 输出 .dot 文件，可以使用 Graphviz 渲染:
 *   dot -Tpng cycles.dot -o cycles.png
 *   dot -Tsvg cycles.dot -o cycles.svg
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const depsFile = args[0] 
  ? path.resolve(process.cwd(), args[0])
  : path.resolve(__dirname, '../extension.js.12-deps.json');

console.log('🎨 循环依赖可视化生成器\n');
console.log(`📂 分析文件: ${depsFile}\n`);

if (!fs.existsSync(depsFile)) {
  console.error(`❌ 错误: 文件不存在: ${depsFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(depsFile, 'utf-8'));
const modules = data.modules;

// 检测循环依赖（简化版）
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

const cycles = detectAllCycles(modules);

console.log(`发现 ${cycles.length} 个循环依赖\n`);

// 生成DOT图表 - 只显示长度为2的循环（最重要的）
function generateShortCyclesDot(cycles, modules) {
  const shortCycles = cycles.filter(c => c.length === 2);
  const nodes = new Set();
  const edges = new Set();
  
  for (const cycle of shortCycles) {
    const [node1, node2] = cycle.path;
    nodes.add(node1);
    nodes.add(node2);
    
    // 双向边
    const edge = node1 < node2 ? `${node1}--${node2}` : `${node2}--${node1}`;
    edges.add(edge);
  }
  
  let dot = 'graph ShortCycles {\n';
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style="rounded,filled", fillcolor=lightblue];\n';
  dot += '  edge [color=red, penwidth=2];\n\n';
  
  // 添加节点（带标签显示大小）
  for (const node of nodes) {
    const mod = modules[node];
    const size = mod ? (mod.codeSize / 1024).toFixed(1) : '?';
    const deps = mod?.dependencies?.length || 0;
    dot += `  "${node}" [label="${node}\\n${size}KB (${deps}deps)"];\n`;
  }
  
  dot += '\n';
  
  // 添加边
  for (const edge of edges) {
    const [node1, node2] = edge.split('--');
    dot += `  "${node1}" -- "${node2}" [label="⇄", fontcolor=red];\n`;
  }
  
  dot += '}\n';
  return dot;
}

// 生成DOT图表 - 高频循环模块及其关系
function generateTopModulesDot(cycles, modules, topN = 10) {
  const moduleInCycles = new Map();
  
  for (const cycle of cycles) {
    const modulesInCycle = cycle.path.slice(0, -1);
    for (const moduleName of modulesInCycle) {
      moduleInCycles.set(moduleName, (moduleInCycles.get(moduleName) || 0) + 1);
    }
  }
  
  const topModules = [...moduleInCycles.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name]) => name);
  
  const topModulesSet = new Set(topModules);
  const edges = new Map(); // edge -> count
  
  // 收集相关边
  for (const cycle of cycles) {
    const modulesInCycle = cycle.path.slice(0, -1);
    for (let i = 0; i < modulesInCycle.length; i++) {
      const from = modulesInCycle[i];
      const to = modulesInCycle[(i + 1) % modulesInCycle.length];
      
      if (topModulesSet.has(from) && topModulesSet.has(to)) {
        const edgeKey = `${from}->${to}`;
        edges.set(edgeKey, (edges.get(edgeKey) || 0) + 1);
      }
    }
  }
  
  let dot = 'digraph TopCyclicModules {\n';
  dot += '  rankdir=TB;\n';
  dot += '  node [shape=box, style="rounded,filled"];\n';
  dot += '  edge [color=red];\n\n';
  
  // 添加节点（颜色根据循环参与度）
  for (const node of topModules) {
    const count = moduleInCycles.get(node) || 0;
    const mod = modules[node];
    const size = mod ? (mod.codeSize / 1024).toFixed(1) : '?';
    
    // 颜色梯度
    let color = 'lightblue';
    if (count > 40) color = 'red';
    else if (count > 30) color = 'orange';
    else if (count > 20) color = 'yellow';
    
    dot += `  "${node}" [label="${node}\\n${count}个循环\\n${size}KB", fillcolor=${color}];\n`;
  }
  
  dot += '\n';
  
  // 添加边（粗细根据频率）
  for (const [edge, count] of edges.entries()) {
    const [from, to] = edge.split('->');
    const penwidth = Math.min(1 + count / 2, 5);
    dot += `  "${from}" -> "${to}" [penwidth=${penwidth}, label="${count}"];\n`;
  }
  
  dot += '}\n';
  return dot;
}

// 生成最复杂循环的可视化
function generateComplexCycleDot(cycle, modules) {
  const modulesInCycle = cycle.path.slice(0, -1);
  
  let dot = `digraph Cycle_${cycle.length} {\n`;
  dot += '  rankdir=LR;\n';
  dot += '  node [shape=box, style="rounded,filled", fillcolor=lightcoral];\n';
  dot += '  edge [color=darkred, penwidth=2];\n\n';
  
  // 添加节点
  for (const node of modulesInCycle) {
    const mod = modules[node];
    const size = mod ? (mod.codeSize / 1024).toFixed(1) : '?';
    dot += `  "${node}" [label="${node}\\n${size}KB"];\n`;
  }
  
  dot += '\n';
  
  // 添加循环边
  for (let i = 0; i < modulesInCycle.length; i++) {
    const from = modulesInCycle[i];
    const to = modulesInCycle[(i + 1) % modulesInCycle.length];
    dot += `  "${from}" -> "${to}";\n`;
  }
  
  dot += '}\n';
  return dot;
}

// 保存文件
const baseName = path.basename(depsFile, '.json');

// 1. 短循环图
const shortCyclesDot = generateShortCyclesDot(cycles, modules);
const shortCyclesFile = path.join(path.dirname(depsFile), `${baseName}-short-cycles.dot`);
fs.writeFileSync(shortCyclesFile, shortCyclesDot, 'utf-8');
console.log(`✅ 短循环图已保存: ${shortCyclesFile}`);

// 2. 高频模块图
const topModulesDot = generateTopModulesDot(cycles, modules, 15);
const topModulesFile = path.join(path.dirname(depsFile), `${baseName}-top-modules.dot`);
fs.writeFileSync(topModulesFile, topModulesDot, 'utf-8');
console.log(`✅ 高频模块图已保存: ${topModulesFile}`);

// 3. 最长循环示例
const longestCycles = cycles.sort((a, b) => b.length - a.length).slice(0, 3);
longestCycles.forEach((cycle, index) => {
  const dot = generateComplexCycleDot(cycle, modules);
  const file = path.join(path.dirname(depsFile), `${baseName}-complex-cycle-${index + 1}.dot`);
  fs.writeFileSync(file, dot, 'utf-8');
  console.log(`✅ 复杂循环 #${index + 1} (长度${cycle.length})已保存: ${file}`);
});

console.log('\n' + '─'.repeat(70));
console.log('💡 渲染DOT文件为图片（需要安装Graphviz）:\n');
console.log(`   dot -Tpng ${path.basename(shortCyclesFile)} -o short-cycles.png`);
console.log(`   dot -Tsvg ${path.basename(topModulesFile)} -o top-modules.svg`);
console.log('\n   在线渲染: https://dreampuf.github.io/GraphvizOnline/');
console.log('─'.repeat(70) + '\n');

