#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const inputFile = path.resolve(process.argv[2] || '../extension.js');
const renameMapFile = path.resolve(process.argv[3] || '../meaningful-rename-map.json');

console.log('读取文件:', inputFile);
const code = fs.readFileSync(inputFile, 'utf-8');

console.log('解析 AST...');
const ast = parser.parse(code, {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowUndeclaredExports: true,
  errorRecovery: true,
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

// 读取已有的重命名映射
const existingMap = JSON.parse(fs.readFileSync(renameMapFile, 'utf-8'));
const alreadyRenamed = new Set(Object.keys(existingMap).filter(k => !k.startsWith('_')));

// 收集所有顶层变量声明
const symbols = new Map(); // name -> { type, line, count }

traverse(ast, {
  Program(path) {
    // 只收集程序顶层的绑定
    Object.keys(path.scope.bindings).forEach(name => {
      const binding = path.scope.bindings[name];
      if (binding && binding.path && binding.path.node.loc) {
        // 判断是否是短名称（可能是混淆的）
        const isShortName = /^[A-Z][a-z]?[0-9]?$|^[a-z][A-Z][0-9]?$/.test(name);
        const isMixedCase = /^[a-z][A-Z]/.test(name);
        const isSingleLetter = /^[A-Za-z]$/.test(name);
        
        // 获取声明类型
        let declType = 'unknown';
        if (binding.path.isVariableDeclarator()) declType = 'variable';
        else if (binding.path.isFunctionDeclaration()) declType = 'function';
        else if (binding.path.isClassDeclaration()) declType = 'class';
        else if (binding.path.isImportSpecifier()) declType = 'import';
        else if (binding.path.isImportDefaultSpecifier()) declType = 'import_default';
        
        // 只收集可能需要重命名的符号
        if ((isShortName || isMixedCase || isSingleLetter) && 
            !alreadyRenamed.has(name) && 
            declType !== 'import' && 
            declType !== 'import_default') {
          
          if (!symbols.has(name)) {
            symbols.set(name, {
              type: declType,
              line: binding.path.node.loc.start.line,
              count: 0
            });
          }
        }
      }
    });
  },
  
  // 统计每个符号的使用次数
  Identifier(path) {
    const name = path.node.name;
    if (symbols.has(name)) {
      const info = symbols.get(name);
      info.count++;
    }
  }
});

// 按使用频率排序
const sorted = Array.from(symbols.entries())
  .sort((a, b) => b[1].count - a[1].count)
  .filter(([name, info]) => info.count > 5); // 只显示使用超过5次的

console.log('\n=== 可能需要重命名的符号 ===\n');
console.log('格式: 符号名 | 类型 | 首次出现行 | 使用次数\n');

sorted.forEach(([name, info]) => {
  console.log(`${name.padEnd(15)} | ${info.type.padEnd(10)} | 行 ${String(info.line).padStart(6)} | 使用 ${info.count} 次`);
});

console.log(`\n找到 ${sorted.length} 个可能需要重命名的符号`);
console.log(`已跳过 ${alreadyRenamed.size} 个已在映射中的符号`);

