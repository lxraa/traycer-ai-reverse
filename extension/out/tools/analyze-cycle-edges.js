/**
 * analyze-cycle-edges.js - 分析循环依赖中的导出边界
 * 
 * 目标：找出循环依赖模块之间通过什么导出函数/类连接
 * 这些导出就是原始源码模块的边界
 * 
 * 使用方法:
 *   node analyze-cycle-edges.js [代码文件] [deps.json]
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const args = process.argv.slice(2);
const codeFile = args[0] 
  ? path.resolve(process.cwd(), args[0])
  : path.resolve(__dirname, '../extension.js.12');

const depsFile = args[1]
  ? path.resolve(process.cwd(), args[1])
  : path.resolve(__dirname, '../extension.js.12-deps.json');

console.log('🔍 循环依赖边界分析工具\n');
console.log(`📂 代码文件: ${codeFile}`);
console.log(`📊 依赖文件: ${depsFile}\n`);

// 读取文件
const code = fs.readFileSync(codeFile, 'utf-8');
const depsData = JSON.parse(fs.readFileSync(depsFile, 'utf-8'));

console.log('🔗 分析模块导出...\n');

// 解析AST
const ast = parser.parse(code, {
  sourceType: 'script',
  plugins: ['jsx'],
  errorRecovery: true,
});

// 存储每个模块的导出信息
const moduleExports = new Map(); // moduleName -> { functions: [], classes: [], objects: [] }

// 分析每个模块的导出
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
    const exports = {
      functions: [],
      classes: [],
      variables: [],
      objects: [],
      reExports: []
    };
    
    // 分析模块内部，查找导出
    path.traverse({
      // 查找函数导出: function xxx() {}
      FunctionDeclaration(innerPath) {
        const funcNode = innerPath.node;
        if (funcNode.id && t.isIdentifier(funcNode.id)) {
          // 检查这个函数是否被导出（作为返回值或赋值给导出对象）
          const funcName = funcNode.id.name;
          exports.functions.push({
            name: funcName,
            params: funcNode.params.length,
            async: funcNode.async,
            generator: funcNode.generator
          });
        }
      },
      
      // 查找类导出: class Xxx {}
      ClassDeclaration(innerPath) {
        const classNode = innerPath.node;
        if (classNode.id && t.isIdentifier(classNode.id)) {
          const className = classNode.id.name;
          const methods = [];
          
          // 提取类方法
          classNode.body.body.forEach(member => {
            if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
              methods.push({
                name: member.key.name,
                kind: member.kind, // constructor, method, get, set
                static: member.static
              });
            }
          });
          
          exports.classes.push({
            name: className,
            methods,
            superClass: classNode.superClass ? 
              (t.isIdentifier(classNode.superClass) ? classNode.superClass.name : 'unknown') : null
          });
        }
      },
      
      // 查找返回语句中的导出
      ReturnStatement(innerPath) {
        const returnArg = innerPath.node.argument;
        
        // return { func1, func2, Class1 }
        if (t.isObjectExpression(returnArg)) {
          returnArg.properties.forEach(prop => {
            if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
              const key = prop.key;
              const value = prop.value;
              
              if (t.isIdentifier(key)) {
                const exportName = key.name;
                
                // 判断导出类型
                if (t.isIdentifier(value)) {
                  exports.reExports.push({
                    name: exportName,
                    ref: value.name
                  });
                } else if (t.isFunctionExpression(value) || t.isArrowFunctionExpression(value)) {
                  exports.functions.push({
                    name: exportName,
                    params: value.params.length,
                    async: value.async,
                    inline: true
                  });
                } else if (t.isClassExpression(value)) {
                  exports.classes.push({
                    name: exportName,
                    inline: true
                  });
                }
              }
            }
          });
        }
      },
      
      // 查找 exports.xxx = 或 module.exports =
      AssignmentExpression(innerPath) {
        const left = innerPath.node.left;
        const right = innerPath.node.right;
        
        // exports.functionName = ...
        if (t.isMemberExpression(left) && t.isIdentifier(left.object)) {
          if (left.object.name === 'exports' && t.isIdentifier(left.property)) {
            const exportName = left.property.name;
            
            if (t.isFunctionExpression(right) || t.isArrowFunctionExpression(right)) {
              exports.functions.push({
                name: exportName,
                params: right.params.length,
                async: right.async,
                viaExports: true
              });
            } else if (t.isIdentifier(right)) {
              exports.reExports.push({
                name: exportName,
                ref: right.name
              });
            }
          }
        }
      }
    });
    
    moduleExports.set(moduleName, exports);
  }
});

console.log(`   📦 分析了 ${moduleExports.size} 个模块的导出\n`);

// 从deps.json读取循环依赖信息
const cycles = [];
const cycleReport = depsData.analysis || {};

// 提取所有循环（从JSON中重建）
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

console.log(`   🔄 发现 ${cycles.length} 个循环依赖\n`);

// 分析循环依赖中的边
console.log('═'.repeat(70));
console.log('📊 循环依赖边界分析');
console.log('═'.repeat(70));

// 分析短循环（长度2）- 这些最重要
const shortCycles = cycles.filter(c => c.length === 2);

console.log(`\n🔥 双向依赖分析（${shortCycles.length}个）\n`);

shortCycles.forEach((cycle, index) => {
  const [mod1, mod2] = cycle.path.slice(0, 2);
  const exports1 = moduleExports.get(mod1) || {};
  const exports2 = moduleExports.get(mod2) || {};
  
  console.log(`${index + 1}. ${mod1} ⇄ ${mod2}`);
  console.log(`\n   ${mod1} 导出:`);
  
  if (exports1.functions?.length > 0) {
    console.log(`      函数 (${exports1.functions.length}个):`);
    exports1.functions.slice(0, 8).forEach(f => {
      console.log(`         - ${f.name}(${f.params}个参数)${f.async ? ' [async]' : ''}`);
    });
    if (exports1.functions.length > 8) {
      console.log(`         ... 还有 ${exports1.functions.length - 8} 个函数`);
    }
  }
  
  if (exports1.classes?.length > 0) {
    console.log(`      类 (${exports1.classes.length}个):`);
    exports1.classes.forEach(c => {
      console.log(`         - class ${c.name}${c.superClass ? ` extends ${c.superClass}` : ''}`);
      if (c.methods?.length > 0) {
        c.methods.slice(0, 3).forEach(m => {
          console.log(`            · ${m.static ? 'static ' : ''}${m.name}()`);
        });
        if (c.methods.length > 3) {
          console.log(`            · ... 还有 ${c.methods.length - 3} 个方法`);
        }
      }
    });
  }
  
  if (exports1.reExports?.length > 0) {
    console.log(`      重导出 (${exports1.reExports.length}个):`);
    exports1.reExports.slice(0, 5).forEach(r => {
      console.log(`         - ${r.name} (ref: ${r.ref})`);
    });
  }
  
  console.log(`\n   ${mod2} 导出:`);
  
  if (exports2.functions?.length > 0) {
    console.log(`      函数 (${exports2.functions.length}个):`);
    exports2.functions.slice(0, 8).forEach(f => {
      console.log(`         - ${f.name}(${f.params}个参数)${f.async ? ' [async]' : ''}`);
    });
    if (exports2.functions.length > 8) {
      console.log(`         ... 还有 ${exports2.functions.length - 8} 个函数`);
    }
  }
  
  if (exports2.classes?.length > 0) {
    console.log(`      类 (${exports2.classes.length}个):`);
    exports2.classes.forEach(c => {
      console.log(`         - class ${c.name}${c.superClass ? ` extends ${c.superClass}` : ''}`);
      if (c.methods?.length > 0) {
        c.methods.slice(0, 3).forEach(m => {
          console.log(`            · ${m.static ? 'static ' : ''}${m.name}()`);
        });
        if (c.methods.length > 3) {
          console.log(`            · ... 还有 ${c.methods.length - 3} 个方法`);
        }
      }
    });
  }
  
  if (exports2.reExports?.length > 0) {
    console.log(`      重导出 (${exports2.reExports.length}个):`);
    exports2.reExports.slice(0, 5).forEach(r => {
      console.log(`         - ${r.name} (ref: ${r.ref})`);
    });
  }
  
  // 分析可能的解耦方案
  console.log(`\n   💡 建议:`);
  
  const totalExports1 = (exports1.functions?.length || 0) + (exports1.classes?.length || 0);
  const totalExports2 = (exports2.functions?.length || 0) + (exports2.classes?.length || 0);
  
  if (totalExports1 === 0 && totalExports2 === 0) {
    console.log(`      ⚠️  这两个模块都没有明显的导出，可能是中间模块`);
  } else if (totalExports1 > totalExports2 * 3) {
    console.log(`      → ${mod1} 导出较多，${mod2} 可能只是工具/助手模块`);
    console.log(`      → 考虑将 ${mod2} 的功能合并到 ${mod1}`);
  } else if (totalExports2 > totalExports1 * 3) {
    console.log(`      → ${mod2} 导出较多，${mod1} 可能只是工具/助手模块`);
    console.log(`      → 考虑将 ${mod1} 的功能合并到 ${mod2}`);
  } else {
    console.log(`      → 两个模块导出数量相近，需要提取共同依赖`);
    console.log(`      → 或使用依赖注入/事件系统解耦`);
  }
  
  console.log('');
});

// 生成详细报告
const edgeReport = {
  summary: {
    totalCycles: cycles.length,
    shortCycles: shortCycles.length,
    analyzedModules: moduleExports.size
  },
  cycleEdges: []
};

shortCycles.forEach(cycle => {
  const [mod1, mod2] = cycle.path.slice(0, 2);
  const exports1 = moduleExports.get(mod1) || {};
  const exports2 = moduleExports.get(mod2) || {};
  
  edgeReport.cycleEdges.push({
    module1: mod1,
    module2: mod2,
    module1Exports: {
      functions: exports1.functions || [],
      classes: exports1.classes || [],
      reExports: exports1.reExports || []
    },
    module2Exports: {
      functions: exports2.functions || [],
      classes: exports2.classes || [],
      reExports: exports2.reExports || []
    }
  });
});

// 保存详细报告
const outputFile = codeFile.replace(/\.js(\.\d+)?$/, '') + '-cycle-edges.json';
fs.writeFileSync(outputFile, JSON.stringify(edgeReport, null, 2), 'utf-8');

console.log('─'.repeat(70));
console.log(`\n✅ 详细边界报告已保存: ${outputFile}`);
console.log('═'.repeat(70));

