/**
 * deadcode_remove.js - 死代码消除模块
 * 
 * 提供死代码消除功能，可以被其他脚本引用或独立运行
 * 
 * 功能:
 *   1. T闭包内联 - 将 T 闭包中的变量赋值提升到顶层
 *   2. 空闭包清理 - 删除空的 T/k 闭包及其调用
 *   3. 未使用模块清理 - 删除没有依赖的孤立模块
 *   4. 未引用变量清理 - 删除未被引用的顶层变量
 *   5. 未调用函数清理 - 删除未被调用的顶层函数
 *   6. 纯递归函数清理 - 删除只有自身递归调用但没有外部调用的函数
 *   7. 未使用声明变量清理 - 删除声明但从未赋值或使用的变量
 * 
 * 用法 (独立运行):
 *   node deadcode_remove.js [options]
 * 
 * 选项:
 *   --input <file>      输入文件路径
 *   --output <file>     输出文件路径
 *   --max-iterations    最大迭代次数 (默认: 20)
 * 
 * 用法 (作为模块):
 *   const { removeDeadCode } = require('./deadcode_remove');
 *   const result = removeDeadCode(ast, options);
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// ============== 辅助函数 ==============

/**
 * 检查 T/k 闭包是否为空
 */
function isEmptyClosure(init, kSymbol = 'k', tSymbol = 'T') {
  if (!t.isCallExpression(init)) return false;
  if (!t.isIdentifier(init.callee)) return false;
  const funcName = init.callee.name;
  if (funcName !== tSymbol && funcName !== kSymbol) return false;
  
  const arg = init.arguments[0];
  if (!arg) return true;
  if (!t.isArrowFunctionExpression(arg) && !t.isFunctionExpression(arg)) return false;
  
  const body = arg.body;
  
  // () => undefined
  if (t.isIdentifier(body, { name: 'undefined' })) return true;
  
  // 块语句
  if (t.isBlockStatement(body)) {
    const stmts = body.body.filter(s => {
      if (t.isExpressionStatement(s) && t.isStringLiteral(s.expression)) return false;
      return true;
    });
    if (stmts.length === 0) return true;
    if (stmts.length === 1 && t.isExpressionStatement(stmts[0])) {
      const expr = stmts[0].expression;
      if (t.isIdentifier(expr, { name: 'undefined' })) return true;
      // k 模块: 只有空闭包调用（如 l()）
      if (funcName === kSymbol && t.isCallExpression(expr) && 
          t.isIdentifier(expr.callee) && expr.arguments.length === 0) return true;
    }
  }
  
  // k(() => ({}))
  if (funcName === kSymbol && t.isObjectExpression(body) && body.properties.length === 0) return true;
  
  return false;
}

/**
 * 收集变量引用
 */
function collectVarReferences(ast) {
  const refs = new Map();
  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;
      const parent = path.parent;
      if (t.isVariableDeclarator(parent) && parent.id === path.node) return;
      if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
      if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
      refs.set(name, (refs.get(name) || 0) + 1);
    }
  });
  return refs;
}

/**
 * 收集模块信息
 */
function collectModuleInfo(ast, kSymbol = 'k', tSymbol = 'T') {
  const modules = new Map();
  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      if (!t.isIdentifier(id)) return;
      if (!t.isCallExpression(init)) return;
      if (!t.isIdentifier(init.callee)) return;
      
      const funcName = init.callee.name;
      if (funcName !== tSymbol && funcName !== kSymbol) return;
      
      modules.set(id.name, {
        type: funcName,
        path: path,
        calls: new Set(),
        assigns: []
      });
    }
  });
  return modules;
}

/**
 * 收集未初始化的全局变量
 */
function collectUninitializedVars(ast) {
  const vars = new Map();
  traverse(ast, {
    VariableDeclaration(path) {
      if (path.parent.type !== 'Program') return;
      for (const declarator of path.node.declarations) {
        if (t.isIdentifier(declarator.id) && declarator.init === null) {
          vars.set(declarator.id.name, { declarator, declarationPath: path });
        }
      }
    }
  });
  return vars;
}

/**
 * 删除调用表达式
 */
function removeCallExpression(path) {
  if (!path.node || !path.container) return false;
  
  const parent = path.parent;
  if (t.isSequenceExpression(parent)) {
    const index = parent.expressions.indexOf(path.node);
    if (index !== -1) {
      parent.expressions.splice(index, 1);
      if (parent.expressions.length === 1 && path.parentPath && path.parentPath.container) {
        path.parentPath.replaceWith(parent.expressions[0]);
      }
      return true;
    }
  } else if (t.isExpressionStatement(parent) && path.parentPath && path.parentPath.container) {
    path.parentPath.remove();
    return true;
  }
  return false;
}

// ============== 主要导出函数 ==============

/**
 * 执行死代码消除
 * @param {Object} ast - Babel AST
 * @param {Object} options - 配置选项
 * @param {number} options.maxIterations - 最大迭代次数 (默认: 20)
 * @param {boolean} options.verbose - 是否输出详细日志 (默认: true)
 * @param {string} options.kSymbol - CommonJS 模块闭包符号 (默认: 'k')
 * @param {string} options.tSymbol - ESM 模块闭包符号 (默认: 'T')
 * @returns {Object} 统计信息
 */
function removeDeadCode(ast, options = {}) {
  const maxIterations = options.maxIterations || 20;
  const verbose = options.verbose !== false;
  const kSymbol = options.kSymbol || 'k';
  const tSymbol = options.tSymbol || 'T';
  
  const log = verbose ? console.log.bind(console) : () => {};
  
  // 统计
  const stats = {
    globalVarsInlined: 0,
    moduleCallsRemoved: 0,
    unusedModulesRemoved: 0,
    emptyClosuresRemoved: 0,
    emptyCallsRemoved: 0,
    unusedVarsRemoved: 0,
    unusedFuncsRemoved: 0,
    recursiveFuncsRemoved: 0,
    unusedDeclaredVarsRemoved: 0,
    iterations: 0,
  };
  
  log('\n🔄 死代码消除开始...');
  
  for (let iter = 1; iter <= maxIterations; iter++) {
    log(`\n   ════════ DCE 迭代 ${iter} ════════`);
    
    let totalChanges = 0;
    
    // ------ Step 1: T闭包内联 ------
    log('   [1] T闭包内联...');
    
    const allModules = collectModuleInfo(ast, kSymbol, tSymbol);
    const uninitializedVars = collectUninitializedVars(ast);
    
    // 分析 T 闭包的依赖和赋值
    for (const [moduleName, moduleInfo] of allModules) {
      if (moduleInfo.type !== tSymbol) continue;
      
      const init = moduleInfo.path.node.init;
      const arg = init.arguments[0];
      if (!arg) continue;
      
      let body;
      if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
        body = arg.body;
      }
      if (!body) continue;
      
      traverse(body, {
        CallExpression(innerPath) {
          const callee = innerPath.node.callee;
          if (t.isIdentifier(callee) && allModules.has(callee.name)) {
            moduleInfo.calls.add(callee.name);
          }
        },
        AssignmentExpression(innerPath) {
          const left = innerPath.node.left;
          const right = innerPath.node.right;
          if (t.isIdentifier(left) && uninitializedVars.has(left.name)) {
            moduleInfo.assigns.push({ varName: left.name, value: right, path: innerPath });
          }
        },
        noScope: true
      }, moduleInfo.path.scope, moduleInfo.path);
    }
    
    // 叶子节点内联
    const processed = new Set();
    
    function isLeafModule(moduleName) {
      const info = allModules.get(moduleName);
      if (!info || info.type !== tSymbol) return false;
      for (const dep of info.calls) {
        if (!processed.has(dep)) return false;
      }
      return true;
    }
    
    function canSafelyHoist(value) {
      let hasUninitRef = false;
      traverse(value, {
        Identifier(innerPath) {
          const name = innerPath.node.name;
          const parent = innerPath.parent;
          if (t.isMemberExpression(parent) && parent.property === innerPath.node && !parent.computed) return;
          if (t.isObjectProperty(parent) && parent.key === innerPath.node && !parent.computed) return;
          if (uninitializedVars.has(name)) {
            hasUninitRef = true;
            innerPath.stop();
          }
        },
        noScope: true
      }, null, null);
      return !hasUninitRef;
    }
    
    // 找叶子模块
    const leaves = [];
    for (const [moduleName, info] of allModules) {
      if (info.type !== tSymbol) continue;
      if (info.assigns.length === 0) {
        processed.add(moduleName);
        continue;
      }
      if (isLeafModule(moduleName)) {
        leaves.push(moduleName);
      }
    }
    
    let inlinedThisStep = 0;
    for (const moduleName of leaves) {
      const info = allModules.get(moduleName);
      for (const assign of info.assigns) {
        if (!canSafelyHoist(assign.value)) continue;
        
        const varInfo = uninitializedVars.get(assign.varName);
        if (varInfo) {
          varInfo.declarator.init = t.cloneNode(assign.value, true);
          uninitializedVars.delete(assign.varName);
          stats.globalVarsInlined++;
          inlinedThisStep++;
          
          if (assign.path && assign.path.node && assign.path.container) {
            assign.path.replaceWith(t.identifier('undefined'));
          }
        }
      }
      processed.add(moduleName);
    }
    
    // 删除已内联模块的调用
    let callsRemovedThisStep = 0;
    for (const moduleName of leaves) {
      const info = allModules.get(moduleName);
      if (!info) continue;
      
      const remainingAssigns = info.assigns.filter(a => uninitializedVars.has(a.varName));
      if (remainingAssigns.length === 0) {
        for (const [_, otherInfo] of allModules) {
          if (otherInfo.type !== tSymbol) continue;
          const init = otherInfo.path.node.init;
          const arg = init.arguments[0];
          if (!arg) continue;
          
          let body;
          if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) body = arg.body;
          if (!body) continue;
          
          traverse(body, {
            CallExpression(innerPath) {
              if (!innerPath.node || !innerPath.container) return;
              const callee = innerPath.node.callee;
              if (t.isIdentifier(callee) && callee.name === moduleName) {
                if (removeCallExpression(innerPath)) {
                  callsRemovedThisStep++;
                  stats.moduleCallsRemoved++;
                }
              }
            },
            noScope: true
          }, otherInfo.path.scope, otherInfo.path);
        }
      }
    }
    
    log(`       内联: ${inlinedThisStep}, 调用删除: ${callsRemovedThisStep}`);
    totalChanges += inlinedThisStep + callsRemovedThisStep;
    
    // ------ Step 2: 空闭包清理 ------
    log('   [2] 空闭包清理...');
    
    const emptyClosures = new Set();
    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        const init = path.node.init;
        if (!t.isIdentifier(id)) return;
        if (isEmptyClosure(init, kSymbol, tSymbol)) {
          emptyClosures.add(id.name);
        }
      }
    });
    
    // 删除空闭包调用
    let emptyCallsThisStep = 0;
    traverse(ast, {
      CallExpression(path) {
        if (!path.node || !path.container) return;
        const callee = path.node.callee;
        if (!t.isIdentifier(callee)) return;
        if (path.node.arguments.length !== 0) return;
        if (!emptyClosures.has(callee.name)) return;
        
        if (removeCallExpression(path)) {
          emptyCallsThisStep++;
          stats.emptyCallsRemoved++;
        }
      }
    });
    
    // 删除无引用的空闭包
    const varRefs = collectVarReferences(ast);
    let emptyClosuresThisStep = 0;
    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        if (!t.isIdentifier(id)) return;
        if (!emptyClosures.has(id.name)) return;
        
        if ((varRefs.get(id.name) || 0) === 0) {
          path.remove();
          emptyClosuresThisStep++;
          stats.emptyClosuresRemoved++;
        }
      }
    });
    
    log(`       空闭包: ${emptyClosuresThisStep}, 调用: ${emptyCallsThisStep}`);
    totalChanges += emptyClosuresThisStep + emptyCallsThisStep;
    
    // ------ Step 3: 未使用模块清理 ------
    log('   [3] 未使用模块清理...');
    
    const moduleNames = new Set();
    const modulePaths = new Map();
    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        const init = path.node.init;
        if (!t.isIdentifier(id)) return;
        if (!t.isCallExpression(init)) return;
        if (!t.isIdentifier(init.callee)) return;
        const fn = init.callee.name;
        if (fn === kSymbol || fn === tSymbol) {
          moduleNames.add(id.name);
          modulePaths.set(id.name, path);
        }
      }
    });
    
    // 分析模块依赖
    const deps = new Map();
    const revDeps = new Map();
    for (const name of moduleNames) {
      deps.set(name, new Set());
    }
    
    traverse(ast, {
      VariableDeclarator(path) {
        const id = path.node.id;
        const init = path.node.init;
        if (!t.isIdentifier(id)) return;
        if (!moduleNames.has(id.name)) return;
        
        path.traverse({
          Identifier(innerPath) {
            const n = innerPath.node.name;
            if (!moduleNames.has(n) || n === id.name) return;
            const parent = innerPath.parent;
            if (t.isMemberExpression(parent) && parent.property === innerPath.node && !parent.computed) return;
            if (t.isVariableDeclarator(parent) && parent.id === innerPath.node) return;
            if (t.isObjectProperty(parent) && parent.key === innerPath.node && !parent.computed) return;
            
            deps.get(id.name).add(n);
            if (!revDeps.has(n)) revDeps.set(n, new Set());
            revDeps.get(n).add(id.name);
          }
        });
      }
    });
    
    // 找未使用叶子模块
    let unusedModulesThisStep = 0;
    for (const [name, d] of deps) {
      if (d.size === 0 && (!revDeps.has(name) || revDeps.get(name).size === 0)) {
        const path = modulePaths.get(name);
        if (path && path.node && path.node.init) {
          const fn = path.node.init.callee.name;
          if (fn === kSymbol) {
            path.node.init = parser.parseExpression(`${kSymbol}(() => ({}))`);
          } else {
            path.node.init = parser.parseExpression(`${tSymbol}(() => undefined)`);
          }
          unusedModulesThisStep++;
          stats.unusedModulesRemoved++;
        }
      }
    }
    
    // 找孤立的模块子图（相互依赖但没有外部引用的模块组）
    // 1. 找出所有被非模块代码引用的模块（入口模块）
    const entryModules = new Set();
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        if (!t.isIdentifier(callee)) return;
        if (!moduleNames.has(callee.name)) return;
        
        // 检查是否在模块定义内部
        let inModule = false;
        let current = path.parentPath;
        while (current) {
          if (t.isVariableDeclarator(current.node)) {
            const id = current.node.id;
            if (t.isIdentifier(id) && moduleNames.has(id.name)) {
              inModule = true;
              break;
            }
          }
          current = current.parentPath;
        }
        
        if (!inModule) {
          entryModules.add(callee.name);
        }
      }
    });
    
    // 2. 从入口模块开始，标记所有可达的模块
    const reachable = new Set();
    const queue = [...entryModules];
    while (queue.length > 0) {
      const m = queue.shift();
      if (reachable.has(m)) continue;
      reachable.add(m);
      const d = deps.get(m);
      if (d) {
        for (const dep of d) {
          if (!reachable.has(dep)) {
            queue.push(dep);
          }
        }
      }
    }
    
    // 3. 清理不可达的模块
    let orphanedModulesThisStep = 0;
    for (const name of moduleNames) {
      if (!reachable.has(name)) {
        const path = modulePaths.get(name);
        if (path && path.node && path.node.init) {
          const fn = path.node.init.callee?.name;
          if (fn === kSymbol) {
            path.node.init = parser.parseExpression(`${kSymbol}(() => ({}))`);
          } else if (fn === tSymbol) {
            path.node.init = parser.parseExpression(`${tSymbol}(() => undefined)`);
          }
          orphanedModulesThisStep++;
          stats.unusedModulesRemoved++;
        }
      }
    }
    
    if (orphanedModulesThisStep > 0) {
      log(`       孤立模块子图: ${orphanedModulesThisStep}`);
    }
    
    log(`       未使用模块: ${unusedModulesThisStep}`);
    totalChanges += unusedModulesThisStep + orphanedModulesThisStep;
    
    // ------ Step 4: 未引用变量清理 ------
    log('   [4] 未引用变量清理...');
    
    const varRefs2 = collectVarReferences(ast);
    let unusedVarsThisStep = 0;
    
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.parent.type !== 'Program') return;
        
        const toRemove = [];
        for (let i = 0; i < path.node.declarations.length; i++) {
          const decl = path.node.declarations[i];
          if (!t.isIdentifier(decl.id)) continue;
          
          const name = decl.id.name;
          if ((varRefs2.get(name) || 0) === 0 && decl.init) {
            if (t.isCallExpression(decl.init)) {
              if (t.isIdentifier(decl.init.callee, { name: 'require' })) continue;
              if (t.isIdentifier(decl.init.callee) && 
                  (decl.init.callee.name === tSymbol || decl.init.callee.name === kSymbol)) continue;
            }
            toRemove.push(i);
            unusedVarsThisStep++;
            stats.unusedVarsRemoved++;
          }
        }
        
        for (let i = toRemove.length - 1; i >= 0; i--) {
          path.node.declarations.splice(toRemove[i], 1);
        }
        if (path.node.declarations.length === 0) {
          path.remove();
        }
      }
    });
    
    log(`       未引用变量: ${unusedVarsThisStep}`);
    totalChanges += unusedVarsThisStep;
    
    // ------ Step 5: 未调用函数清理 ------
    log('   [5] 未调用函数清理...');
    
    const topLevelFuncs = new Set();
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.parent.type !== 'Program') return;
        if (path.node.id && t.isIdentifier(path.node.id)) {
          topLevelFuncs.add(path.node.id.name);
        }
      }
    });
    
    const funcRefs = new Map();
    traverse(ast, {
      Identifier(path) {
        const name = path.node.name;
        if (!topLevelFuncs.has(name)) return;
        
        const parent = path.parent;
        if (t.isFunctionDeclaration(parent) && parent.id === path.node) return;
        if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
        if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
        
        funcRefs.set(name, (funcRefs.get(name) || 0) + 1);
      }
    });
    
    let unusedFuncsThisStep = 0;
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.parent.type !== 'Program') return;
        if (!path.node.id || !t.isIdentifier(path.node.id)) return;
        
        const name = path.node.id.name;
        if ((funcRefs.get(name) || 0) === 0) {
          path.remove();
          unusedFuncsThisStep++;
          stats.unusedFuncsRemoved++;
        }
      }
    });
    
    log(`       未调用函数: ${unusedFuncsThisStep}`);
    totalChanges += unusedFuncsThisStep;
    
    // ------ Step 6: 纯递归函数清理 ------
    log('   [6] 纯递归函数清理...');
    
    // 收集所有顶层函数及其内部引用
    const funcInfo = new Map();
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.parent.type !== 'Program') return;
        if (!path.node.id || !t.isIdentifier(path.node.id)) return;
        
        const name = path.node.id.name;
        const selfRefs = [];
        const otherFuncRefs = [];
        
        // 遍历函数体，收集对其他函数的引用
        path.traverse({
          Identifier(innerPath) {
            const refName = innerPath.node.name;
            const parent = innerPath.parent;
            
            // 跳过函数声明的 id
            if (t.isFunctionDeclaration(parent) && parent.id === innerPath.node) return;
            // 跳过属性访问
            if (t.isMemberExpression(parent) && parent.property === innerPath.node && !parent.computed) return;
            // 跳过对象属性 key
            if (t.isObjectProperty(parent) && parent.key === innerPath.node && !parent.computed) return;
            
            if (refName === name) {
              selfRefs.push(innerPath);
            }
          }
        });
        
        funcInfo.set(name, {
          path,
          selfRefs,
          externalRefs: 0
        });
      }
    });
    
    // 统计外部引用（在函数体外对函数的引用）
    traverse(ast, {
      Identifier(path) {
        const name = path.node.name;
        if (!funcInfo.has(name)) return;
        
        const parent = path.parent;
        // 跳过函数声明的 id
        if (t.isFunctionDeclaration(parent) && parent.id === path.node) return;
        // 跳过属性访问
        if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
        // 跳过对象属性 key
        if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
        
        // 检查是否在函数自身内部
        let inSelf = false;
        let current = path.parentPath;
        while (current) {
          if (t.isFunctionDeclaration(current.node) && 
              current.node.id && 
              t.isIdentifier(current.node.id) && 
              current.node.id.name === name) {
            inSelf = true;
            break;
          }
          current = current.parentPath;
        }
        
        if (!inSelf) {
          funcInfo.get(name).externalRefs++;
        }
      }
    });
    
    // 删除只有自身递归引用但没有外部引用的函数
    let recursiveFuncsThisStep = 0;
    for (const [name, info] of funcInfo) {
      // 有自身递归引用，但没有外部引用
      if (info.selfRefs.length > 0 && info.externalRefs === 0) {
        info.path.remove();
        recursiveFuncsThisStep++;
        stats.recursiveFuncsRemoved++;
      }
    }
    
    log(`       纯递归函数: ${recursiveFuncsThisStep}`);
    totalChanges += recursiveFuncsThisStep;
    
    // ------ Step 7: 未使用声明变量清理 ------
    log('   [7] 未使用声明变量清理...');
    
    // 收集所有声明但未初始化的变量
    const declaredVars = new Map();
    traverse(ast, {
      VariableDeclaration(path) {
        if (path.parent.type !== 'Program') return;
        
        for (let i = 0; i < path.node.declarations.length; i++) {
          const decl = path.node.declarations[i];
          if (t.isIdentifier(decl.id) && decl.init === null) {
            declaredVars.set(decl.id.name, {
              declarationPath: path,
              declaratorIndex: i,
              isAssigned: false,
              isUsed: false
            });
          }
        }
      }
    });
    
    // 检查这些变量是否被赋值或使用
    traverse(ast, {
      AssignmentExpression(path) {
        const left = path.node.left;
        if (t.isIdentifier(left) && declaredVars.has(left.name)) {
          declaredVars.get(left.name).isAssigned = true;
        }
      },
      Identifier(path) {
        const name = path.node.name;
        if (!declaredVars.has(name)) return;
        
        const parent = path.parent;
        // 跳过变量声明的 id
        if (t.isVariableDeclarator(parent) && parent.id === path.node) return;
        // 跳过赋值左侧
        if (t.isAssignmentExpression(parent) && parent.left === path.node) return;
        // 跳过属性访问
        if (t.isMemberExpression(parent) && parent.property === path.node && !parent.computed) return;
        // 跳过对象属性 key
        if (t.isObjectProperty(parent) && parent.key === path.node && !parent.computed) return;
        
        declaredVars.get(name).isUsed = true;
      }
    });
    
    // 删除未赋值且未使用的声明变量
    let unusedDeclaredVarsThisStep = 0;
    const pathsToClean = new Map(); // declarationPath -> indices to remove
    
    for (const [name, info] of declaredVars) {
      if (!info.isAssigned && !info.isUsed) {
        const pathKey = info.declarationPath;
        if (!pathsToClean.has(pathKey)) {
          pathsToClean.set(pathKey, []);
        }
        pathsToClean.get(pathKey).push(info.declaratorIndex);
        unusedDeclaredVarsThisStep++;
        stats.unusedDeclaredVarsRemoved++;
      }
    }
    
    // 从后往前删除，避免索引错乱
    for (const [path, indices] of pathsToClean) {
      indices.sort((a, b) => b - a);
      for (const idx of indices) {
        path.node.declarations.splice(idx, 1);
      }
      if (path.node.declarations.length === 0) {
        path.remove();
      }
    }
    
    log(`       未使用声明变量: ${unusedDeclaredVarsThisStep}`);
    totalChanges += unusedDeclaredVarsThisStep;
    
    stats.iterations = iter;
    
    log(`   本轮变化: ${totalChanges}`);
    if (totalChanges === 0) {
      log('   无更多变化，停止迭代');
      break;
    }
  }
  
  log(`\n   DCE 总计: ${stats.iterations} 轮迭代`);
  
  return stats;
}

// ============== 命令行入口 ==============

function main() {
  const args = process.argv.slice(2);
  
  // 如果作为模块被 require，不执行 main
  if (require.main !== module) return;
  
  const options = {
    input: null,
    output: null,
    maxIterations: 20,
    kSymbol: 'k',
    tSymbol: 'T',
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        options.input = path.resolve(args[++i]);
        break;
      case '--output':
        options.output = path.resolve(args[++i]);
        break;
      case '--max-iterations':
        options.maxIterations = parseInt(args[++i], 10);
        break;
      case '--k-symbol':
        options.kSymbol = args[++i];
        break;
      case '--t-symbol':
        options.tSymbol = args[++i];
        break;
      case '--help':
        console.log(`
deadcode_remove.js - 死代码消除工具

用法:
  node deadcode_remove.js --input <file> --output <file> [options]

选项:
  --input <file>        输入文件路径 (必需)
  --output <file>       输出文件路径 (必需)
  --max-iterations <n>  最大迭代次数 (默认: 20)
  --k-symbol <name>     CommonJS 模块闭包符号 (默认: k)
  --t-symbol <name>     ESM 模块闭包符号 (默认: T)
  --help                显示帮助信息
`);
        process.exit(0);
    }
  }
  
  if (!options.input || !options.output) {
    console.error('❌ 错误: 必须指定 --input 和 --output');
    process.exit(1);
  }
  
  console.log('🗑️ deadcode_remove.js - 死代码消除工具\n');
  console.log(`📂 输入文件: ${options.input}`);
  console.log(`📄 输出文件: ${options.output}`);
  
  if (!fs.existsSync(options.input)) {
    console.error(`❌ 错误: 输入文件不存在: ${options.input}`);
    process.exit(1);
  }
  
  const code = fs.readFileSync(options.input, 'utf-8');
  console.log(`📊 文件大小: ${(code.length / 1024 / 1024).toFixed(2)} MB\n`);
  
  console.log('🔧 解析 AST...');
  const ast = parser.parse(code, {
    sourceType: 'script',
    plugins: ['jsx'],
    errorRecovery: true,
  });
  console.log('✅ AST 解析成功');
  
  console.log(`📂 闭包符号: k=${options.kSymbol}, T=${options.tSymbol}`);
  
  const stats = removeDeadCode(ast, {
    maxIterations: options.maxIterations,
    verbose: true,
    kSymbol: options.kSymbol,
    tSymbol: options.tSymbol,
  });
  
  console.log('\n💾 生成输出代码...');
  const output = generate(ast, {
    retainLines: false,
    compact: false,
    comments: true,
  });
  
  fs.writeFileSync(options.output, output.code, 'utf-8');
  
  const originalSize = code.length;
  const newSize = output.code.length;
  const savedSize = originalSize - newSize;
  
  console.log(`📊 原文件大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 新文件大小: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📉 节省: ${(savedSize / 1024).toFixed(1)} KB (${(savedSize / originalSize * 100).toFixed(1)}%)`);
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ 处理完成!');
  console.log('═'.repeat(60));
  console.log(`
📊 处理统计 (${stats.iterations} 轮迭代):
   - T闭包内联: ${stats.globalVarsInlined} 个变量, ${stats.moduleCallsRemoved} 次调用
   - 空闭包清理: ${stats.emptyClosuresRemoved} 个, ${stats.emptyCallsRemoved} 次调用
   - 未使用模块: ${stats.unusedModulesRemoved} 个
   - 未引用变量: ${stats.unusedVarsRemoved} 个
   - 未调用函数: ${stats.unusedFuncsRemoved} 个
   - 纯递归函数: ${stats.recursiveFuncsRemoved} 个
   - 未使用声明变量: ${stats.unusedDeclaredVarsRemoved} 个
`);
}

// 运行 main
main();

// 导出供其他模块使用
module.exports = {
  removeDeadCode,
  isEmptyClosure,
  collectVarReferences,
  collectModuleInfo,
  collectUninitializedVars,
};

