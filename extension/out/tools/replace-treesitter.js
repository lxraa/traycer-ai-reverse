/**
 * 将 treeSitterWasm 模块定义替换为 require
 */
const fs = require('fs');
const path = require('path');

const extensionPath = path.join(__dirname, '../extension.js');

console.log('📦 替换 treeSitterWasm 模块为 require...');

const code = fs.readFileSync(extensionPath, 'utf8');
const lines = code.split('\n');

// 找到 treeSitterWasm 定义的起始行和结束行
const startLine = 19661; // 0-indexed, 对应第 19662 行
const endLine = 21625;   // 0-indexed, 对应第 21626 行

// 验证起始行
if (!lines[startLine].includes('treeSitterWasm = __commonJS')) {
  console.error('❌ 错误: 起始行不匹配');
  console.error('   期望包含: treeSitterWasm = __commonJS');
  console.error('   实际内容:', lines[startLine]);
  process.exit(1);
}

// 验证结束行
if (!lines[endLine].trim().startsWith('}),')) {
  console.error('❌ 错误: 结束行不匹配');
  console.error('   期望以 }), 开头');
  console.error('   实际内容:', lines[endLine]);
  process.exit(1);
}

console.log('   起始行 (19662):', lines[startLine].slice(0, 60) + '...');
console.log('   结束行 (21626):', lines[endLine]);

// 构建新的代码
const newLines = [
  ...lines.slice(0, startLine),
  "  treeSitterWasm = require('./modules/tree-sitter-wasm.js'),",
  ...lines.slice(endLine + 1)
];

const newCode = newLines.join('\n');

// 备份原文件
const backupPath = extensionPath + '.backup-treesitter';
fs.writeFileSync(backupPath, code, 'utf8');
console.log('   备份已保存到:', backupPath);

// 写入新文件
fs.writeFileSync(extensionPath, newCode, 'utf8');

const removedLines = endLine - startLine;
console.log('\n✅ 替换完成!');
console.log('   删除了', removedLines, '行代码');
console.log('   原文件行数:', lines.length);
console.log('   新文件行数:', newLines.length);
console.log('   减少:', lines.length - newLines.length, '行');

