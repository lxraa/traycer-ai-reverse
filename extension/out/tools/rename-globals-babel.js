#!/usr/bin/env node
'use strict';

/**
 * 使用 Babel AST 解析和重命名全局变量的脚本
 * 
 * 功能：
 * - 读取 JSON 配置文件获取重命名映射
 * - 解析 JavaScript 文件的 AST
 * - 识别全局变量的声明和使用
 * - 根据映射进行重命名
 * - 生成重命名后的代码
 * 
 * 使用方法：
 * node rename-globals-babel.js <input-file> <rename-map.json> [output-file]
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * 读取 JSON 配置文件
 * @param {string} configPath - 配置文件路径
 * @returns {Object} 重命名映射对象 { oldName: newName }
 */
function loadRenameMap(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    // 支持两种格式：
    // 1. { "renameMap": { "old": "new" } }
    // 2. 直接 { "old": "new" }
    const renameMap = config.renameMap || config;
    
    console.log(`✓ 加载重命名映射: ${Object.keys(renameMap).length} 个变量`);
    return renameMap;
  } catch (error) {
    console.error(`✗ 无法读取配置文件 ${configPath}:`, error.message);
    process.exit(1);
  }
}

/**
 * 读取源代码文件
 * @param {string} filePath - 源文件路径
 * @returns {string} 文件内容
 */
function loadSourceFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`✓ 读取源文件: ${filePath} (${content.length} 字节)`);
    return content;
  } catch (error) {
    console.error(`✗ 无法读取源文件 ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * 解析 JavaScript 代码为 AST
 * @param {string} code - 源代码
 * @returns {Object} Babel AST
 */
function parseCode(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: 'unambiguous',  // 自动检测
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      allowUndeclaredExports: true,
      errorRecovery: true,  // 启用错误恢复
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'asyncGenerators',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });
    console.log('✓ 成功解析 AST');
    return ast;
  } catch (error) {
    console.error('✗ AST 解析失败:', error.message);
    console.error('  错误位置:', error.loc);
    process.exit(1);
  }
}

/**
 * 收集作用域信息和导入的变量
 * @param {Object} ast - Babel AST
 * @returns {Object} 作用域信息
 */
function collectScopeInfo(ast) {
  const globalVars = new Set();
  const localScopes = new Map(); // 记录每个作用域的局部变量
  const importedVars = new Set(); // 记录所有从外部导入的变量
  const declaredVars = new Set(); // 记录所有已声明的变量（包括内部声明和导入）
  
  traverse(ast, {
    Program(path) {
      // 收集全局作用域的变量
      Object.keys(path.scope.bindings).forEach(name => {
        globalVars.add(name);
        declaredVars.add(name);
        
        // 检查是否是导入的变量
        const binding = path.scope.bindings[name];
        if (binding && binding.path) {
          const bindingPath = binding.path;
          
          // 检查是否是 ES6 import 导入
          if (t.isImportSpecifier(bindingPath.node) || 
              t.isImportDefaultSpecifier(bindingPath.node) ||
              t.isImportNamespaceSpecifier(bindingPath.node)) {
            importedVars.add(name);
            return;
          }
          
          // 检查是否是 require() 导入
          // 1. 简单导入: const x = require(...)
          // 2. 解构导入: const { x, y } = require(...)
          if (bindingPath.isVariableDeclarator()) {
            const declarator = bindingPath.node;
            if (declarator.init && t.isCallExpression(declarator.init)) {
              const callExpr = declarator.init;
              // 检查是否是 require() 调用
              if (t.isIdentifier(callExpr.callee) && callExpr.callee.name === 'require') {
                // 对于简单导入 const x = require(...)，x 是模块对象，不是导入的变量
                // 只有解构导入的变量才算是真正的导入变量
                if (t.isObjectPattern(declarator.id)) {
                  // 解构导入：const { PhaseSize, CommentSeverity } = require(...)
                  // 将所有解构出来的变量都标记为导入变量
                  declarator.id.properties.forEach(prop => {
                    if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
                      importedVars.add(prop.value.name);
                    }
                  });
                }
              }
            }
          }
        }
      });
    },
    
    // 收集函数作用域的局部变量
    FunctionDeclaration(path) {
      const localVars = new Set();
      Object.keys(path.scope.bindings).forEach(name => {
        localVars.add(name);
        declaredVars.add(name);
      });
      localScopes.set(path.node, localVars);
    },
    
    FunctionExpression(path) {
      const localVars = new Set();
      Object.keys(path.scope.bindings).forEach(name => {
        localVars.add(name);
        declaredVars.add(name);
      });
      localScopes.set(path.node, localVars);
    },
    
    ArrowFunctionExpression(path) {
      const localVars = new Set();
      Object.keys(path.scope.bindings).forEach(name => {
        localVars.add(name);
        declaredVars.add(name);
      });
      localScopes.set(path.node, localVars);
    }
  });
  
  console.log(`✓ 识别到 ${importedVars.size} 个导入变量，将跳过它们的所有引用`);
  if (importedVars.size > 0) {
    console.log(`  导入变量列表: ${Array.from(importedVars).slice(0, 10).join(', ')}${importedVars.size > 10 ? '...' : ''}`);
  }
  console.log(`✓ 识别到 ${declaredVars.size} 个已声明变量，用于冲突检测`);
  
  return { globalVars, localScopes, importedVars, declaredVars };
}

/**
 * 清理无用的自赋值语句（如：var imported = imported）
 * @param {Object} ast - Babel AST
 * @param {Set} importedVars - 导入的变量集合
 * @returns {number} 清理的语句数量
 */
function cleanupSelfAssignments(ast, importedVars) {
  let cleaned = 0;
  
  traverse(ast, {
    VariableDeclarator(path) {
      try {
        // 检查是否是自赋值模式: var x = x
        if (path.node.id && path.node.init && 
            t.isIdentifier(path.node.id) && 
            t.isIdentifier(path.node.init) &&
            path.node.id.name === path.node.init.name) {
          
          const varName = path.node.id.name;
          
          // 如果这个变量是导入的，删除这个自赋值
          if (importedVars.has(varName)) {
            console.log(`  清理无用的自赋值: var ${varName} = ${varName}`);
            
            // 如果这是唯一的声明，删除整个声明语句
            const declaration = path.parentPath;
            if (declaration.isVariableDeclaration() && 
                declaration.node.declarations.length === 1) {
              declaration.remove();
            } else {
              // 如果有多个声明，只删除这一个
              path.remove();
            }
            
            cleaned++;
          }
        }
      } catch (error) {
        console.error(`清理自赋值时出错:`, error.message);
      }
    }
  });
  
  return cleaned;
}

/**
 * 解析重命名映射并处理符号冲突
 * @param {Object} renameMap - 原始重命名映射
 * @param {Set} declaredVars - 已声明的变量集合
 * @returns {Object} 处理后的重命名映射和冲突报告
 */
function resolveNameConflicts(renameMap, declaredVars) {
  const resolvedMap = {};
  const conflicts = [];
  const usedNewNames = new Set();
  
  // 过滤掉以 _ 开头的注释键
  const validEntries = Object.entries(renameMap).filter(([key]) => !key.startsWith('_'));
  
  console.log('\n检测符号冲突...');
  
  for (const [oldName, newName] of validEntries) {
    // 验证新名称是否合法
    if (!newName || typeof newName !== 'string' || newName.trim() === '') {
      console.warn(`⚠ 跳过非法重命名: ${oldName} -> ${JSON.stringify(newName)}`);
      continue;
    }
    
    let finalName = newName;
    let suffix = 0;
    
    // 检查新名称是否与已存在的变量冲突（且不是自己）
    while (declaredVars.has(finalName) && finalName !== oldName) {
      suffix++;
      finalName = `${newName}_${suffix}`;
      
      // 如果也被使用过了，继续加后缀
      while (usedNewNames.has(finalName)) {
        suffix++;
        finalName = `${newName}_${suffix}`;
      }
    }
    
    // 检查是否与其他重命名目标冲突
    while (usedNewNames.has(finalName) && finalName !== oldName) {
      suffix++;
      finalName = `${newName}_${suffix}`;
    }
    
    // 记录冲突
    if (finalName !== newName) {
      conflicts.push({
        oldName,
        requestedName: newName,
        actualName: finalName,
        reason: declaredVars.has(newName) ? '与已声明变量冲突' : '与其他重命名目标冲突'
      });
      console.log(`  ⚠ 冲突: ${oldName} -> ${newName} 改为 -> ${finalName}`);
    }
    
    resolvedMap[oldName] = finalName;
    usedNewNames.add(finalName);
    
    // 同时将新名称标记为已使用，避免后续重命名冲突
    declaredVars.add(finalName);
  }
  
  if (conflicts.length > 0) {
    console.log(`✓ 检测到 ${conflicts.length} 个符号冲突，已自动添加后缀`);
  } else {
    console.log('✓ 未检测到符号冲突');
  }
  
  return { resolvedMap, conflicts };
}

/**
 * 重命名全局变量
 * @param {Object} ast - Babel AST
 * @param {Object} renameMap - 重命名映射
 * @returns {Object} 统计信息
 */
function renameGlobalVariables(ast, renameMap) {
  const stats = {
    renamed: 0,
    skipped: 0,
    skippedImported: 0,  // 新增：跳过的导入变量计数
    locations: []
  };
  
  // 收集作用域信息和导入变量
  const { globalVars, importedVars } = collectScopeInfo(ast);
  
  traverse(ast, {
    // 处理标识符（变量名）
    Identifier(path) {
      try {
        const oldName = path.node.name;
        const newName = renameMap[oldName];
        
        // 如果不在重命名映射中，跳过
        if (!newName) {
          return;
        }
        
        // 验证新名称是否合法
        if (!newName || typeof newName !== 'string' || newName.trim() === '') {
          console.warn(`跳过非法重命名: ${oldName} -> ${JSON.stringify(newName)}`);
          stats.skipped++;
          return;
        }
        
        // ===== 关键修复：检查是否是导入的变量 =====
        // 如果这个变量在导入列表中，跳过所有对它的引用
        if (importedVars.has(oldName)) {
          stats.skippedImported++;
          return;
        }
        
        // 同样，如果新名称对应的变量是导入的，也要跳过
        // 这样可以避免把内部变量重命名成和导入变量相同的名字
        if (importedVars.has(newName)) {
          console.warn(`⚠ 跳过重命名 ${oldName} -> ${newName}，因为 ${newName} 是导入的变量`);
          stats.skipped++;
          return;
        }
        
        // 检查是否是模块级全局变量
        const binding = path.scope.getBinding(oldName);
        
        // 如果找到绑定，检查它是否是在程序顶层（模块作用域）声明的
        if (binding) {
          // 获取绑定的作用域
          const bindingScope = binding.scope;
          
          // 如果绑定在程序作用域（全局/模块作用域），需要进一步检查
          if (bindingScope.path.isProgram()) {
            // 检查是否是通过 require() 或 import 导入的变量
            const bindingPath = binding.path;
            
            // 检查是否是 import 语句导入
            if (t.isImportSpecifier(bindingPath) || 
                t.isImportDefaultSpecifier(bindingPath) ||
                t.isImportNamespaceSpecifier(bindingPath)) {
              // 这是从外部模块导入的变量，跳过重命名（双重保险）
              stats.skippedImported++;
              return;
            }
            
            // 检查是否是 require() 导入（简化版，已在前面检查过）
            if (bindingPath.isVariableDeclarator()) {
              const declarator = bindingPath.node;
              if (declarator.init && t.isCallExpression(declarator.init)) {
                const callExpr = declarator.init;
                if (t.isIdentifier(callExpr.callee) && callExpr.callee.name === 'require') {
                  if (t.isObjectPattern(declarator.id)) {
                    // 解构导入的变量，已在前面标记过，跳过
                    stats.skippedImported++;
                    return;
                  }
                }
              }
            }
            
            // 这是文件内部声明的模块级全局变量，允许重命名
            // 继续执行
          } else {
            // 这是局部变量，跳过
            stats.skipped++;
            return;
          }
        }
        
        // 跳过对象属性名（除非是计算属性）
        if (path.parent.type === 'MemberExpression' && 
            path.parent.property === path.node && 
            !path.parent.computed) {
          return;
        }
        
        // 跳过对象字面量的键（除非是简写属性）
        if (path.parent.type === 'ObjectProperty' && 
            path.parent.key === path.node &&
            !path.parent.shorthand) {
          return;
        }
        
        // 跳过导入/导出的说明符
        if (t.isImportSpecifier(path.parent) || 
            t.isExportSpecifier(path.parent)) {
          return;
        }
        
        // 执行重命名
        path.node.name = newName;
        stats.renamed++;
        stats.locations.push({
          oldName,
          newName,
          line: path.node.loc?.start.line,
          column: path.node.loc?.start.column
        });
      } catch (error) {
        console.error(`重命名错误 at line ${path.node.loc?.start.line}:`, error.message);
        stats.skipped++;
      }
    }
  });
  
  return stats;
}

/**
 * 生成重命名后的代码
 * @param {Object} ast - Babel AST
 * @param {Object} options - 生成选项
 * @returns {string} 生成的代码
 */
function generateCode(ast, options = {}) {
  const defaultOptions = {
    retainLines: false,  // 改为 false，避免行号相关问题
    comments: true,
    compact: false,
    concise: false,
    jsescOption: {
      minimal: true
    }
  };
  
  try {
    const result = generate(ast, { ...defaultOptions, ...options });
    console.log(`✓ 生成代码: ${result.code.length} 字节`);
    return result.code;
  } catch (error) {
    console.error('✗ 代码生成失败:', error.message);
    console.error('尝试使用最小配置重新生成...');
    
    // 尝试最小配置
    const minimalResult = generate(ast, {
      compact: false,
      comments: false
    });
    console.log(`✓ 使用最小配置生成代码: ${minimalResult.code.length} 字节`);
    return minimalResult.code;
  }
}

/**
 * 写入输出文件
 * @param {string} filePath - 输出文件路径
 * @param {string} content - 文件内容
 */
function writeOutputFile(filePath, content) {
  try {
    // 创建备份
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`✓ 创建备份: ${backupPath}`);
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ 写入输出文件: ${filePath}`);
  } catch (error) {
    console.error(`✗ 无法写入文件 ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * 生成重命名报告
 * @param {Object} stats - 统计信息
 * @param {string} outputPath - 报告输出路径
 * @param {Array} conflicts - 冲突信息
 */
function generateReport(stats, outputPath, conflicts = []) {
  // 无论输出文件名是什么，都在后面加 .rename-report.json
  const reportPath = outputPath + '.rename-report.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRenamed: stats.renamed,
      totalSkipped: stats.skipped,
      totalConflicts: conflicts.length
    },
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    locations: stats.locations
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`✓ 生成重命名报告: ${reportPath}`);
  
  if (conflicts.length > 0) {
    console.log(`  包含 ${conflicts.length} 个符号冲突的详细信息`);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  // 解析命令行参数
  if (args.length < 2) {
    console.error('使用方法: node rename-globals-babel.js <input-file> <rename-map.json> [output-file]');
    console.error('');
    console.error('参数说明:');
    console.error('  input-file      : 要处理的 JavaScript 源文件');
    console.error('  rename-map.json : 重命名映射配置文件 (JSON 格式)');
    console.error('  output-file     : 输出文件路径 (可选，默认覆盖输入文件)');
    console.error('');
    console.error('配置文件格式示例:');
    console.error('{');
    console.error('  "oldVarName1": "newVarName1",');
    console.error('  "oldVarName2": "newVarName2"');
    console.error('}');
    process.exit(1);
  }
  
  const inputFile = path.resolve(args[0]);
  const configFile = path.resolve(args[1]);
  const outputFile = args[2] ? path.resolve(args[2]) : inputFile;
  
  console.log('='.repeat(60));
  console.log('Babel AST 全局变量重命名工具');
  console.log('='.repeat(60));
  console.log(`输入文件: ${inputFile}`);
  console.log(`配置文件: ${configFile}`);
  console.log(`输出文件: ${outputFile}`);
  console.log('='.repeat(60));
  console.log('');
  
  // 1. 加载配置
  const renameMap = loadRenameMap(configFile);
  
  // 2. 读取源文件
  const sourceCode = loadSourceFile(inputFile);
  
  // 3. 解析 AST
  const ast = parseCode(sourceCode);
  
  // 3.5 收集导入变量信息和已声明变量
  console.log('收集符号信息...');
  const { importedVars, declaredVars } = collectScopeInfo(ast);
  
  // 3.6 处理符号冲突
  const { resolvedMap, conflicts } = resolveNameConflicts(renameMap, declaredVars);
  
  // 3.7 清理无用的自赋值语句
  if (importedVars.size > 0) {
    console.log('\n清理无用的自赋值语句...');
    const cleanedCount = cleanupSelfAssignments(ast, importedVars);
    if (cleanedCount > 0) {
      console.log(`✓ 清理了 ${cleanedCount} 个无用的自赋值语句`);
    }
  }
  
  // 4. 重命名全局变量（使用解决冲突后的映射）
  console.log('\n开始重命名全局变量...');
  const stats = renameGlobalVariables(ast, resolvedMap);
  
  // 5. 生成代码
  const outputCode = generateCode(ast);
  
  // 6. 写入输出
  writeOutputFile(outputFile, outputCode);
  
  // 7. 生成报告（包含冲突信息）
  generateReport(stats, outputFile, conflicts);
  
  // 8. 显示统计信息
  console.log('');
  console.log('='.repeat(60));
  console.log('重命名完成！');
  console.log('='.repeat(60));
  console.log(`✓ 成功重命名: ${stats.renamed} 处`);
  console.log(`✓ 跳过导入变量: ${stats.skippedImported} 处`);
  console.log(`✓ 跳过局部变量: ${stats.skipped} 处`);
  if (conflicts.length > 0) {
    console.log(`⚠ 符号冲突: ${conflicts.length} 个（已自动添加后缀）`);
  }
  console.log('='.repeat(60));
}

// 运行主函数
if (require.main === module) {
  main();
}

// 导出供其他模块使用
module.exports = {
  loadRenameMap,
  parseCode,
  collectScopeInfo,
  resolveNameConflicts,
  renameGlobalVariables,
  generateCode
};

