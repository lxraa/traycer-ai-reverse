/**
 * 统一模块别名 - 将 `alias = xxx_module; use(alias)` 转换为直接使用 `xxx_module`
 * 
 * 处理模式:
 * - `Zp = path_module` → 将所有 `Zp` 引用替换为 `path_module`
 * - `Ute = diff_match_patch_module` → 将所有 `Ute` 引用替换为 `diff_match_patch_module`
 * 
 * 注意作用域：只在赋值语句可见的作用域内进行替换
 */

const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const fs = require('fs');
const path = require('path');

// 匹配 xxx_module 模式的正则
const MODULE_VAR_PATTERN = /^[a-z_]+_module$/;

/**
 * 收集所有 `alias = xxx_module` 的赋值
 * 返回 Map<aliasName, moduleName>
 */
function collectModuleAliases(ast) {
  const aliases = new Map();
  
  traverse(ast, {
    AssignmentExpression(path) {
      const { left, right } = path.node;
      
      // 检查: alias = xxx_module
      if (
        t.isIdentifier(left) &&
        t.isIdentifier(right) &&
        MODULE_VAR_PATTERN.test(right.name)
      ) {
        const aliasName = left.name;
        const moduleName = right.name;
        
        // 排除自赋值
        if (aliasName !== moduleName) {
          aliases.set(aliasName, {
            moduleName,
            assignmentPath: path,
            scope: path.scope
          });
          console.log(`[发现别名] ${aliasName} = ${moduleName}`);
        }
      }
    },
    
    // 处理 var 声明中的赋值: var Zp = path_module
    VariableDeclarator(path) {
      const { id, init } = path.node;
      
      if (
        t.isIdentifier(id) &&
        init &&
        t.isIdentifier(init) &&
        MODULE_VAR_PATTERN.test(init.name)
      ) {
        const aliasName = id.name;
        const moduleName = init.name;
        
        if (aliasName !== moduleName) {
          aliases.set(aliasName, {
            moduleName,
            declaratorPath: path,
            scope: path.scope
          });
          console.log(`[发现别名声明] var ${aliasName} = ${moduleName}`);
        }
      }
    }
  });
  
  return aliases;
}

/**
 * 替换别名引用为原始模块名
 */
function replaceAliasReferences(ast, aliases) {
  let replacementCount = 0;
  const removedAssignments = new Set();
  
  traverse(ast, {
    Identifier(path) {
      const name = path.node.name;
      const aliasInfo = aliases.get(name);
      
      if (!aliasInfo) return;
      
      // 跳过声明/赋值的左侧
      if (path.parentPath.isAssignmentExpression() && path.key === 'left') {
        return;
      }
      if (path.parentPath.isVariableDeclarator() && path.key === 'id') {
        return;
      }
      
      // 跳过属性访问的键名 (obj.alias 中的 alias)
      if (path.parentPath.isMemberExpression() && path.key === 'property' && !path.parentPath.node.computed) {
        return;
      }
      
      // 跳过对象属性的键名
      if (path.parentPath.isObjectProperty() && path.key === 'key' && !path.parentPath.node.computed) {
        return;
      }
      
      // 检查作用域：确保这个引用能看到别名赋值
      // 对于模块级别的赋值，所有后续引用都应该被替换
      const binding = path.scope.getBinding(name);
      
      // 如果有 binding，说明是局部变量，需要检查是否是我们的别名
      // 如果没有 binding，可能是全局/模块级别的变量
      
      // 执行替换
      path.node.name = aliasInfo.moduleName;
      replacementCount++;
      
      if (replacementCount <= 50) {
        console.log(`[替换] ${name} → ${aliasInfo.moduleName} (at ${path.node.loc?.start?.line || '?'})`);
      } else if (replacementCount === 51) {
        console.log(`[替换] ... 更多替换省略 ...`);
      }
    }
  });
  
  console.log(`\n总计替换 ${replacementCount} 处引用`);
  return replacementCount;
}

/**
 * 移除已无用的别名赋值语句
 */
function removeAliasAssignments(ast, aliases) {
  let removedCount = 0;
  
  traverse(ast, {
    // 处理表达式语句中的赋值: alias = xxx_module;
    ExpressionStatement(path) {
      const expr = path.node.expression;
      if (
        t.isAssignmentExpression(expr) &&
        t.isIdentifier(expr.left) &&
        aliases.has(expr.left.name) &&
        t.isIdentifier(expr.right) &&
        MODULE_VAR_PATTERN.test(expr.right.name)
      ) {
        console.log(`[移除赋值语句] ${expr.left.name} = ${expr.right.name}`);
        path.remove();
        removedCount++;
      }
    },
    
    // 处理逗号表达式中的赋值: (a = 1, alias = xxx_module, b = 2)
    SequenceExpression(path) {
      const expressions = path.node.expressions;
      const newExpressions = expressions.filter(expr => {
        if (
          t.isAssignmentExpression(expr) &&
          t.isIdentifier(expr.left) &&
          aliases.has(expr.left.name) &&
          t.isIdentifier(expr.right) &&
          MODULE_VAR_PATTERN.test(expr.right.name)
        ) {
          console.log(`[移除序列中的赋值] ${expr.left.name} = ${expr.right.name}`);
          removedCount++;
          return false;
        }
        return true;
      });
      
      if (newExpressions.length !== expressions.length) {
        if (newExpressions.length === 0) {
          // 所有表达式都被移除，用 void 0 替代
          path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
        } else if (newExpressions.length === 1) {
          // 只剩一个表达式，不需要序列
          path.replaceWith(newExpressions[0]);
        } else {
          path.node.expressions = newExpressions;
        }
      }
    },
    
    // 处理 var 声明中的别名: var Zp = path_module, other = 1;
    VariableDeclarator(path) {
      const { id, init } = path.node;
      if (
        t.isIdentifier(id) &&
        aliases.has(id.name) &&
        init &&
        t.isIdentifier(init) &&
        MODULE_VAR_PATTERN.test(init.name)
      ) {
        const parent = path.parentPath;
        if (parent.isVariableDeclaration()) {
          const declarators = parent.node.declarations;
          if (declarators.length === 1) {
            // 整个声明只有这一个，移除整个语句
            console.log(`[移除声明语句] var ${id.name} = ${init.name}`);
            parent.remove();
          } else {
            // 声明中有多个，只移除这一个
            console.log(`[移除声明] ${id.name} = ${init.name}`);
            path.remove();
          }
          removedCount++;
        }
      }
    }
  });
  
  console.log(`\n总计移除 ${removedCount} 处别名赋值`);
  return removedCount;
}

/**
 * 主函数
 */
async function main() {
  const inputFile = process.argv[2] || path.join(__dirname, '../extension.js');
  const outputFile = process.argv[3] || inputFile.replace('.js', '.unified.js');
  
  console.log(`输入文件: ${inputFile}`);
  console.log(`输出文件: ${outputFile}`);
  console.log('');
  
  // 读取源文件
  console.log('读取源文件...');
  const source = fs.readFileSync(inputFile, 'utf-8');
  
  // 解析 AST
  console.log('解析 AST...');
  const ast = babel.parseSync(source, {
    sourceType: 'script',
    plugins: [],
    // 保留注释
    comments: true
  });
  
  // 第一遍：收集别名
  console.log('\n=== 第一遍：收集模块别名 ===');
  const aliases = collectModuleAliases(ast);
  console.log(`\n发现 ${aliases.size} 个模块别名\n`);
  
  if (aliases.size === 0) {
    console.log('没有发现需要处理的别名，退出。');
    return;
  }
  
  // 第二遍：替换引用
  console.log('\n=== 第二遍：替换别名引用 ===');
  const replacementCount = replaceAliasReferences(ast, aliases);
  
  // 第三遍：移除别名赋值
  console.log('\n=== 第三遍：移除别名赋值 ===');
  const removedCount = removeAliasAssignments(ast, aliases);
  
  // 生成代码
  console.log('\n生成代码...');
  const output = generate(ast, {
    comments: true,
    compact: false,
    // 保持原有格式
    retainLines: false,
    // 不添加分号（让原有风格保持）
    // semicolons: true
  }, source);
  
  // 写入文件
  console.log('写入文件...');
  fs.writeFileSync(outputFile, output.code, 'utf-8');
  
  console.log('\n=== 完成 ===');
  console.log(`别名数量: ${aliases.size}`);
  console.log(`替换数量: ${replacementCount}`);
  console.log(`移除数量: ${removedCount}`);
  console.log(`输出文件: ${outputFile}`);
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});

